document.addEventListener('DOMContentLoaded', () => {
  const journeyForm = document.getElementById('journey-form');
  const pnrForm = document.getElementById('pnr-form');
  const trainResults = document.getElementById('train-results');
  const pnrStatus = document.getElementById('pnr-status');
  const bookingHistoryDiv = document.getElementById('booking-history');

  // Load booking history on popup load
  loadBookingHistory();

  journeyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    trainResults.textContent = 'Searching trains...';

    const source = journeyForm.source.value.trim();
    const destination = journeyForm.destination.value.trim();
    const date = journeyForm.date.value;

    if (!source || !destination || !date) {
      trainResults.textContent = 'Please fill all journey details.';
      return;
    }

    try {
      const trains = await fetchTrainAvailability(source, destination, date);
      displayTrainResults(trains);
    } catch (error) {
      trainResults.textContent = 'Error fetching train data.';
      console.error(error);
    }
  });

  pnrForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    pnrStatus.textContent = 'Checking PNR status...';

    const pnr = pnrForm.pnr.value.trim();

    if (!pnr || pnr.length !== 10) {
      pnrStatus.textContent = 'Please enter a valid 10-digit PNR number.';
      return;
    }

    try {
      const status = await fetchPnrStatus(pnr);
      displayPnrStatus(status);
    } catch (error) {
      pnrStatus.textContent = 'Error fetching PNR status.';
      console.error(error);
    }
  });

  function displayTrainResults(trains) {
    if (!trains || trains.length === 0) {
      trainResults.textContent = 'No trains found for the selected route and date.';
      return;
    }
    trainResults.innerHTML = '';
    trains.forEach(train => {
      const div = document.createElement('div');
      div.className = 'train-item';
      div.textContent = `${train.trainNumber} - ${train.trainName} | Departure: ${train.departureTime} | Fare: ₹${train.fare}`;
      trainResults.appendChild(div);
    });
  }

  function displayPnrStatus(status) {
    if (!status) {
      pnrStatus.textContent = 'No status found for this PNR.';
      return;
    }
    pnrStatus.innerHTML = `
      <p><strong>PNR:</strong> ${status.pnr}</p>
      <p><strong>Train:</strong> ${status.trainName} (${status.trainNumber})</p>
      <p><strong>Journey Date:</strong> ${status.journeyDate}</p>
      <p><strong>Status:</strong> ${status.currentStatus}</p>
    `;
  }

  async function fetchTrainAvailability(source, destination, date) {
    // Placeholder: Implement actual API call or scraping logic here
    // Returning mock data for now
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          {
            trainNumber: '12345',
            trainName: 'Express Train',
            departureTime: '10:00 AM',
            fare: 500
          },
          {
            trainNumber: '67890',
            trainName: 'Superfast Express',
            departureTime: '02:00 PM',
            fare: 750
          }
        ]);
      }, 1000);
    });
  }

  async function fetchPnrStatus(pnr) {
    // Placeholder: Implement actual API call or scraping logic here
    // Returning mock data for now
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          pnr: pnr,
          trainName: 'Express Train',
          trainNumber: '12345',
          journeyDate: '2024-06-15',
          currentStatus: 'Confirmed'
        });
      }, 1000);
    });
  }

  function loadBookingHistory() {
    chrome.storage.local.get(['bookingHistory'], (result) => {
      const history = result.bookingHistory || [];
      if (history.length === 0) {
        bookingHistoryDiv.textContent = 'No booking history available.';
        return;
      }
      bookingHistoryDiv.innerHTML = '';
      history.forEach((booking, index) => {
        const div = document.createElement('div');
        div.className = 'booking-item';
        div.textContent = `${booking.trainName} (${booking.trainNumber}) on ${booking.journeyDate} - Status: ${booking.status}`;
        bookingHistoryDiv.appendChild(div);
      });
    });
  }
});
