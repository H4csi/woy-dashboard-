// =======================================================================
// --- KONFIGURASI ---
// =======================================================================
const channelID = "3040742";
const readApiKey = "YO6R4VABWMKAHYDF";
const talkBackID = "55232";
const talkBackApiKey = "U2SDL5VJ66V1I2F7";
const password = "fahruganteng";
// =======================================================================

// Variabel Elemen Tampilan
const tempElement = document.getElementById("temp-value");
const humElement = document.getElementById("hum-value");
const soilElement = document.getElementById("soil-value");
const lightElement = document.getElementById("light-value");
const timeElement = document.getElementById("time-display");
const dateElement = document.getElementById("date-display");
const connectionElement = document.getElementById("connection-status");
const greenhouseStatusElement = document.getElementById("greenhouse-status");
const autoModeToggle = document.getElementById("auto-mode-toggle");
const autoModeStatusText = document.getElementById("auto-mode-status-text");
const manualControlCard = document.getElementById("manual-control-card");
const manualControlText = document.getElementById("manual-control-text");
const relayStatusIndicator = document.getElementById("relay-status-indicator");
const automationOverlay = document.getElementById("automation-overlay");

function sendCommand(command) {
    console.log(`%cMENGIRIM PERINTAH: ${command}`, 'color: blue; font-weight: bold;');
    fetch(`https://api.thingspeak.com/talkbacks/${talkBackID}/commands.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `api_key=${talkBackApiKey}&command_string=${command}`
    })
    .then(response => response.text())
    .then(text => { 
        console.log("Respon dari TalkBack:", text); 
    })
    .catch(error => { 
        console.error("Gagal mengirim perintah:", error); 
    });
}

function setDisconnected() {
    connectionElement.innerText = "Disconnected";
    connectionElement.className = "status-disconnected";
    greenhouseStatusElement.innerText = "Inactive";
    greenhouseStatusElement.className = "status-disconnected";
    tempElement.innerHTML = `-- &deg;C`;
    humElement.innerText = `-- %`;
    soilElement.innerText = `-- %`;
    lightElement.innerText = `-- %`;
}

function fetchData() {
    fetch(`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readApiKey}&results=1`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            const lastEntry = data.feeds[0];
            if (!lastEntry) {
                setDisconnected();
                return;
            }

            console.log('--- LAPORAN DATA DARI THINGSPEAK (LENGKAP) ---');
            console.log(`[FIELD 1] Suhu: ${lastEntry.field1}`);
            console.log(`[FIELD 2] Lembap Udara: ${lastEntry.field2}`);
            console.log(`[FIELD 3] Lembap Tanah: ${lastEntry.field3}`);
            console.log(`[FIELD 4] Cahaya: ${lastEntry.field4}`);
            console.log(`%c[FIELD 5] Status Pompa: ${lastEntry.field5 === '1' ? 'NYALA' : 'MATI'}`, 'color: green;');
            console.log(`%c[FIELD 6] Mode Otomatis: ${lastEntry.field6 === '1' ? 'ON' : 'OFF'}`, 'color: green;');
            console.log('-------------------------------------------');

            const timestamp = new Date(lastEntry.created_at);
            const now = new Date();
            const ageInSeconds = (now - timestamp) / 1000;

            if (ageInSeconds > 60) {
                setDisconnected();
                return;
            }

            connectionElement.innerText = "Connected";
            connectionElement.className = "status-active";
            greenhouseStatusElement.innerText = "Active";
            greenhouseStatusElement.className = "status-active";

            tempElement.innerHTML = `${parseFloat(lastEntry.field1 || 0).toFixed(2)} &deg;C`;
            humElement.innerText = `${parseFloat(lastEntry.field2 || 0).toFixed(2)} %`;
            soilElement.innerText = `${parseFloat(lastEntry.field3 || 0).toFixed(0)} %`;
            lightElement.innerText = `${parseFloat(lastEntry.field4 || 0).toFixed(0)} %`;
            
            const isAutoModeOn_server = lastEntry.field6 === '1';
            const isPumpRunning_server = lastEntry.field5 === '1';
            
            autoModeToggle.checked = isAutoModeOn_server;
            autoModeStatusText.innerText = isAutoModeOn_server ? "ON" : "OFF";
            relayStatusIndicator.checked = isPumpRunning_server;

            if (isAutoModeOn_server) {
                manualControlCard.classList.remove("enabled", "running");
                if (isPumpRunning_server) {
                    manualControlText.innerText = "Watering...";
                } else {
                    manualControlText.innerText = "Run Now";
                }
            } else {
                manualControlCard.classList.add("enabled");
                if (isPumpRunning_server) {
                    manualControlText.innerText = "Watering...";
                    manualControlCard.classList.add("running");
                } else {
                    manualControlText.innerText = "Manual";
                }
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            setDisconnected();
        });
}

function updateTime() {
    const now = new Date();
    timeElement.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    dateElement.innerText = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

function unlockControls() {
    const enteredPassword = prompt("Masukkan password untuk membuka kontrol:");
    if (enteredPassword === password) {
        automationOverlay.style.display = 'none';
        alert('Kontrol berhasil dibuka!');
    } else if (enteredPassword !== null) {
        alert('Password salah!');
    }
}

autoModeToggle.addEventListener('change', function() { sendCommand(this.checked ? 'AUTO_ON' : 'AUTO_OFF'); });
manualControlCard.addEventListener('click', function() { if (manualControlCard.classList.contains('enabled')) { sendCommand('WATER_NOW'); } });
automationOverlay.addEventListener('click', unlockControls);

fetchData();
updateTime();
setInterval(fetchData, 8000);
setInterval(updateTime, 1000);