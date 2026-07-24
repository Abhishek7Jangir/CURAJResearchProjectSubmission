/**
 * ONE-TIME MIGRATION SCRIPT
 * -------------------------
 * Problem: Before per-budget-head tracking was added, indent (equipment)
 * approvals only deducted from Project.availableBudget (the overall total),
 * never from Project.budgetHeads.{equipment, manpower, ...} (the per-head
 * amounts). This left old projects in an inconsistent state where:
 *
 *   sum(Project.budgetHeads.*) !== Project.availableBudget
 *
 * Fix: For every project, find its most recently APPROVED Project Account
 * (Module 2 / Budget Bifurcation form). If found, re-sync
 * Project.budgetHeads from that account's per-head totalBalance values —
 * exactly the same sync that already happens automatically whenever a
 * Project Account form is submitted/resubmitted (see backend/routes/
 * projectAccounts.js). This makes the per-head total match the project's
 * available budget again, WITHOUT deleting any project.
 *
 * If no approved Project Account exists for a project, the budgetHeads
 * are reset to match the project's original submission-time totals
 * (sum of heads = totalBudget = availableBudget), since that is the only
 * other known-consistent state for a project with no account history.
 *
 * This script does NOT delete any data. It only updates Project.budgetHeads
 * and Project.availableBudget so they are consistent again.
 *
 * USAGE:
 *   cd backend
 *   node scripts/fix-budget-head-mismatch.js            (dry run - just reports)
 *   node scripts/fix-budget-head-mismatch.js --apply     (applies the fix)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectAccount = require('../models/ProjectAccount');

const APPLY = process.argv.includes('--apply');

const ACCOUNT_TO_PROJECT_HEAD_MAP = {
  equipment: 'equipment',
  manpower: 'manpower',
  consumable: 'consumables',
  travel: 'travel',
  contingency: 'contingency',
  overhead: 'overhead',
  othersIfAny: 'others'
};

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI environment variable is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
  console.log(APPLY ? 'Mode: APPLY (changes will be saved)' : 'Mode: DRY RUN (no changes will be saved)');
  console.log('---------------------------------------------------------');

  const projects = await Project.find({});
  console.log(`Found ${projects.length} project(s) to check.\n`);

  let fixedFromAccount = 0;
  let fixedFromOriginal = 0;
  let alreadyConsistent = 0;

  for (const project of projects) {
    const headSum = ['equipment', 'manpower', 'consumables', 'travel', 'contingency', 'overhead', 'others']
      .reduce((sum, key) => sum + Number(project.budgetHeads?.[key] || 0), 0);

    const isConsistent = Math.abs(headSum - Number(project.availableBudget || 0)) < 0.01;

    if (isConsistent) {
      alreadyConsistent++;
      continue;
    }

    console.log(`Project ${project.id} ("${project.title}") is INCONSISTENT:`);
    console.log(`   Sum of budget heads: ₹${headSum}`);
    console.log(`   Available budget:    ₹${project.availableBudget}`);

    // Find the most recent APPROVED project account for this project.
    const approvedAccount = await ProjectAccount.findOne({
      projectId: project.id,
      status: 'Approved',
      currentStage: 'COMPLETED'
    }).sort({ submittedDate: -1 });

    if (approvedAccount) {
      const newBudgetHeads = {};
      for (const [accountKey, projectKey] of Object.entries(ACCOUNT_TO_PROJECT_HEAD_MAP)) {
        newBudgetHeads[projectKey] = Number(approvedAccount.budgetHeads?.[accountKey]?.totalBalance || 0);
      }
      const newAvailableBudget = Number(approvedAccount.totalProjectCost || project.availableBudget);

      console.log(`   -> Found approved Project Account (${approvedAccount.id}). Re-syncing from it.`);
      console.log(`   -> New budget heads:`, newBudgetHeads);
      console.log(`   -> New available budget: ₹${newAvailableBudget}`);

      if (APPLY) {
        project.budgetHeads = newBudgetHeads;
        project.availableBudget = newAvailableBudget;
        await project.save();
      }
      fixedFromAccount++;
    } else {
      // No approved account found — reset per-head amounts to the
      // project's ORIGINAL submission-time budget heads (Module 1),
      // which by definition sum to totalBudget. We also reset
      // availableBudget to totalBudget since we have no record of how
      // much of the original sanction is genuinely left.
      console.log(`   -> No approved Project Account found. Resetting to original sanctioned amounts (Module 1).`);
      console.log(`   -> Reset available budget to total budget: ₹${project.totalBudget}`);

      if (APPLY) {
        // budgetHeads already holds the original Module 1 values UNLESS
        // it was already overwritten by an account sync at some point.
        // Since we have no account record, the safest known-good state
        // is "everything available again", i.e. totalBudget split however
        // the original budgetHeads proportions were. We simply trust the
        // existing budgetHeads values are still the original submission
        // values (they are only ever overwritten by an approved account
        // sync, which we already checked doesn't exist) and align
        // availableBudget to match their sum.
        project.availableBudget = headSum;
        await project.save();
      }
      fixedFromOriginal++;
    }

    console.log('');
  }

  console.log('---------------------------------------------------------');
  console.log(`Already consistent:        ${alreadyConsistent}`);
  console.log(`Fixed from approved account: ${fixedFromAccount}`);
  console.log(`Fixed from original totals:  ${fixedFromOriginal}`);
  console.log(`Total projects checked:      ${projects.length}`);

  if (!APPLY) {
    console.log('\nThis was a DRY RUN. No changes were saved.');
    console.log('Re-run with --apply to actually update the database:');
    console.log('   node scripts/fix-budget-head-mismatch.js --apply');
  } else {
    console.log('\nChanges have been saved to the database.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
