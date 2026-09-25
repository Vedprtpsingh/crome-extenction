const array1 = ["what", "how", "why", "when", "where", "who", "which", "can", "do", "is", "are", "does", "will", "should", "could", "would", "may", "might", "shall", "has", "have", "had", "was", "were", "be", "been", "being", "tell", "say", "ask", "know", "think", "feel", "see", "hear", "want", "need", "like", "love", "hate"];
const array2 = ["is", "to", "does", "can", "will", "should", "could", "would", "may", "might", "shall", "has", "have", "had", "was", "were", "be", "been", "being", "do", "does", "did", "make", "made", "get", "got", "go", "went", "come", "came", "run", "walk", "eat", "drink", "sleep", "work", "play", "read", "write", "speak"];
const array3 = ["the", "a", "an", "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their", "some", "any", "every", "all", "many", "much", "few", "little", "first", "last", "next", "new", "old", "good", "bad", "big", "small", "hot", "cold", "fast", "slow", "easy", "hard", "quick", "slow", "happy", "sad"];
const countries = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];
const flowers = ["rose", "tulip", "sunflower", "daisy", "lily", "orchid", "violet", "jasmine", "lavender", "poppy", "chrysanthemum", "peony", "iris", "carnation", "gerbera", "hibiscus", "magnolia", "cherry blossom", "lotus", "dandelion"];
const animals = ["tiger", "elephant", "lion", "giraffe", "zebra", "monkey", "bear", "wolf", "fox", "rabbit", "deer", "horse", "cow", "pig", "sheep", "dog", "cat", "bird", "fish", "snake"];
const places = ["Paris", "London", "New York", "Tokyo", "Sydney", "Rome", "Berlin", "Moscow", "Beijing", "Mumbai", "Cairo", "Rio", "Cape Town", "Amsterdam", "Vienna", "Prague", "Barcelona", "Venice", "Florence", "Athens"];
const array4 = [...countries, ...flowers, ...animals, ...places];

function generatePhrases() {
  const phrases = new Set();
  const arrays = [array1, array2, array3, array4];
  while (phrases.size < 30) {
    const numWords = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    const selectedArrays = arrays.slice().sort(() => Math.random() - 0.5).slice(0, numWords);
    const words = selectedArrays.map(arr => arr[Math.floor(Math.random() * arr.length)]);
    const phrase = words.join(' ');
    phrases.add(phrase);
  }
  return Array.from(phrases);
}

const phrases = generatePhrases();

let completedCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  displayPhrases();
  resetUI();
});

function resetUI() {
  completedCount = 0;
  document.getElementById('progress').value = 0;
  document.getElementById('totalTime').textContent = '';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'completed') {
    completedCount++;
    document.getElementById('progress').value = completedCount;
  } else if (message.action === 'finished') {
    document.getElementById('totalTime').textContent = `Total time: ${message.totalTime} seconds`;
  }
});

function displayPhrases() {
  const list = document.getElementById('phrasesList');
  list.innerHTML = '<ol>' + phrases.map(p => `<li>${p}</li>`).join('') + '</ol>';
}

function loadSettings() {
  chrome.storage.local.get(['searchEngine', 'useCurrentTab'], (result) => {
    document.getElementById('searchEngine').value = result.searchEngine || 'google';
    document.getElementById('useCurrentTab').checked = result.useCurrentTab !== false;
  });
}

function saveSettings() {
  const searchEngine = document.getElementById('searchEngine').value;
  const useCurrentTab = document.getElementById('useCurrentTab').checked;
  chrome.storage.local.set({ searchEngine, useCurrentTab });
}

document.getElementById('searchEngine').addEventListener('change', saveSettings);
document.getElementById('useCurrentTab').addEventListener('change', saveSettings);

document.getElementById('start').addEventListener('click', () => {
  if (!document.getElementById('consent').checked) {
    alert('Please check the consent checkbox to proceed.');
    return;
  }
  completedCount = 0;
  document.getElementById('progress').value = 0;
  document.getElementById('totalTime').textContent = '';
  const searchEngine = document.getElementById('searchEngine').value;
  const useCurrentTab = document.getElementById('useCurrentTab').checked;
  chrome.runtime.sendMessage({ action: 'start', searchEngine, useCurrentTab, phrases });
  document.getElementById('start').disabled = true;
  document.getElementById('stop').disabled = false;
});

document.getElementById('stop').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stop' });
  document.getElementById('start').disabled = false;
  document.getElementById('stop').disabled = true;
});
