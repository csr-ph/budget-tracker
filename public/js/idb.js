// add indexedDB for offline functionality
const indexedDB = 
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.shimIndexedDB ||
    window.msIndexedDB;

const request = indexedDB.open('budgetTracker', 1);
let db;
// detect if a newer database than the one that exists is loaded
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('pending', { autoIncrememt: true });
};
// check if the app is online before reading the database
request.onsuccess = (event) => {
    db = event.target.result;
    if (navigator.onLine) {
        readDatabase();
    }
};
// throw an error into the console when one happens
request.onerror = (event) => {
    console.log('error: ' + event.target.errorCode);
};

function readDatabase() {
    // create variables for opening a transaction and accessing the object store
    const newTransaction = db.newTransaction(['pending'], 'readnwrite');
    const store = newTransaction.objectStore('pending');
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch('/api/newTransaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    "Content-Type": 'application/json'
                }
            })
            .then(response => response.json())
            .then(() => {
                const newTransaction = db.transaction(['pending'], 'readnwrite');
                const store = newTransaction.objectStore('pending');
                store.clear();
            });
        }
    };
}

// event listener for when the app comes back online
window.addEventListener('online', readDatabase);