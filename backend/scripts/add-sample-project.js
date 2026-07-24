require('dotenv').config(); // Load environment variables

const { initializeDatabase } = require('./database');
const User = require('./models/User');
const Project = require('./models/Project');
const ApprovalHistory = require('./models/ApprovalHistory');

async function addSampleProject() {
  try {
    await initializeDatabase();

    // First, check if there are any users
    let user = await User.findOne({ email: 'test@curaj.ac.in' });

    if (!user) {
      console.log('No test user found. Creating one...');
      user = await User.create({
        userName: 'Test Professor',
        email: 'test@curaj.ac.in',
        password: '$2b$10$dummyhash', // In a real app, use a proper hashed password
        designation: 'professor',
        department: 'Computer Science',
      });
      console.log('Test user created: test@curaj.ac.in');
    } else {
      console.log('Test user already exists: test@curaj.ac.in');
      // Fetch the existing user to use its properties for project creation
      user = await User.findOne({ email: 'test@curaj.ac.in' });
    }

    // Check if sample project already exists
    let existingProject = await Project.findOne({ id: 'PRJ-SAMPLE-001' });

    if (existingProject) {
      console.log('Sample project already exists. Updating it to Approved status...');
      existingProject.status = 'Approved';
      existingProject.currentStage = 'COMPLETED';
      await existingProject.save();
      console.log('Sample project updated to Approved status!');
    } else {
      // Insert sample approved project
      const projectId = 'PRJ-SAMPLE-001';
      const totalBudget = 500000;

      const project = await Project.create({
        id: projectId,
        title: 'Advanced Machine Learning for Healthcare Applications',
        fundingAgency: 'DST (Department of Science and Technology)',
        pi: user.userName,
        coPi: 'Dr. Co-Investigator',
        totalBudget: totalBudget,
        availableBudget: totalBudget,
        duration: '3 years',
        submittedBy: user.email,
        status: 'Approved',
        currentStage: 'COMPLETED',
        fileName: 'research-proposal-sample.pdf',
        fileType: 'application/pdf',
        fileUrl: 'http://localhost:3001/api/projects/download/PRJ-SAMPLE-001',
      });

      // Add approval history to show it went through all stages
      const stages = ['HOD', 'DEAN', 'R&D_HELPER', 'R&D_MAIN', 'FINANCE_OFFICER_HELPER', 'FINANCE_OFFICER_MAIN', 'REGISTRAR'];
      const stageUserEmails = [
        'hod@curaj.ac.in', 'dean@curaj.ac.in', 'rnd_helper@curaj.ac.in',
        'rnd_main@curaj.ac.in', 'finance_officer_helper@curaj.ac.in',
        'finance_officer_main@curaj.ac.in', 'registrar@curaj.ac.in',
      ];
      const stageUserNames = [
        'Dr. Head of Department', 'Dr. Dean', 'R&D Office',
        'R&D', 'Finance Office',
        'Finance Officer', 'Registrar',
      ];

      for (let i = 0; i < stages.length; i++) {
        await ApprovalHistory.create({
          projectId: projectId,
          stage: stages[i],
          status: 'Approved',
          userName: stageUserNames[i],
          userEmail: stageUserEmails[i],
          comment: `Approved at ${stages[i]} stage`,
          actionDate: new Date(Date.now() - (stages.length - 1 - i) * 24 * 60 * 60 * 1000), // Stagger dates
        });
      }

      console.log('Sample approved project created successfully!');
      console.log('Project ID:', project.id);
      console.log('Title:', project.title);
      console.log('Status:', project.status);
      console.log('Budget:', project.totalBudget);
    }

    // Verify the project
    const project = await Project.findOne({ id: 'PRJ-SAMPLE-001' });
    console.log('\nProject Details:');
    console.log(JSON.stringify(project, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error adding sample project:', error);
    process.exit(1);
  }
}

addSampleProject();
