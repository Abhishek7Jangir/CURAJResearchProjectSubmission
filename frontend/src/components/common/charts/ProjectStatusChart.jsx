// src/components/ProjectStatusChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define our colors to match the stat cards
const COLORS = {
  Pending: '#FFC107',  // A nice yellow
  Approved: '#4CAF50', // A nice green
  Rejected: '#F44336', // A nice red
};

const ProjectStatusChart = ({ pending, approved, rejected }) => {
  // Format the data for the chart
  const data = [
    { name: 'Pending', value: pending },
    { name: 'Approved', value: approved },
    { name: 'Rejected', value: rejected },
  ];

  // Custom legend formatter
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col space-y-2 mt-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: COLORS[entry.value] }}
            ></span>
            <span className="text-gray-700">{entry.value}:</span>
            <span className="font-semibold ml-1">{entry.payload.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Project Status Distribution</h3>
      {/* ResponsiveContainer makes the chart fit its parent div */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          {/* Tooltip shows details on hover */}
          <Tooltip />

          {/* The Pie itself */}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60} // This makes it a donut chart
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {/* Map data entries to Cells with specific colors */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
            ))}
          </Pie>

          {/* Custom Legend */}
          <Legend content={renderLegend} layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectStatusChart;