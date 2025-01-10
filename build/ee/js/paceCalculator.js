let paceTable;

async function loadPaceTable() {
  try {
    const response = await fetch('/js/paceTable.json');
    const data = await response.json();
    console.log('Loaded data:', data); // Debug log

    if (
      !data ||
      !data.pace_conversions ||
      !Array.isArray(data.pace_conversions)
    ) {
      throw new Error('Invalid data structure in paceTable.json');
    }

    paceTable = data.pace_conversions;
    populateTable();
  } catch (error) {
    console.error('Error loading pace table:', error);
    const tableBody = document.getElementById('pace-table-body');
    tableBody.innerHTML =
      '<tr><td colspan="8">Error loading pace data</td></tr>';
  }
}

function populateTable() {
  const tableBody = document.getElementById('pace-table-body');

  paceTable.forEach((row, index) => {
    try {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.speed_kph.toFixed(1)}</td>
        <td>${row.per_km}</td>
        <td>${row.per_mile}</td>
        <td>${row['5k']}</td>
        <td>${row['10k']}</td>
        <td>${row.half_marathon}</td>
        <td>${row.marathon}</td>
      `;
      tableBody.appendChild(tr);
    } catch (error) {
      console.error('Error creating row:', error, row);
    }
  });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', loadPaceTable);