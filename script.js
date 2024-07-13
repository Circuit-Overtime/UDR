const joystick1 = document.getElementById('joystick1');
const joystick2 = document.getElementById('joystick2');
const container1 = joystick1.parentElement;
const container2 = joystick2.parentElement;
const joystick1Value = document.getElementById('joystick1Value');
const joystick2Value = document.getElementById('joystick2Value');
const analogValueDisplay = document.getElementById('analogValueDisplay');

window.onload = function() {
  globalThis.throttle = 1000;
  globalThis.pitch = 1497;
  globalThis.roll = 1497;
  globalThis.yaw = 1497; 
};

let joysticks = [
    { joystick: joystick1, container: container1, isDragging: false, containerRect: null, resetY: false, touchId: null, valueX: 1497, valueY: 1010 },
    { joystick: joystick2, container: container2, isDragging: false, containerRect: null, resetY: true, touchId: null, valueX: 1497, valueY: 1497 }
];

window.addEventListener('load', () => {
    joysticks.forEach(js => {
        js.containerRect = js.container.getBoundingClientRect();
        const containerCenterX = js.containerRect.width / 2;
        const containerCenterY = js.containerRect.height / 2;

        // Set initial positions
        js.joystick.style.left = `${containerCenterX}px`;

        if (js.joystick === joystick1) {
            // Initialize Y position for joystick 1
            const y = containerCenterY - ((1002 - 1497) / 500) * (containerCenterX - js.joystick.offsetWidth / 2);
            js.joystick.style.top = `${y}px`;
            joystick1Value.textContent = `Joystick 1: X=${js.valueX}, Y=${js.valueY}`;
        } else {
            js.joystick.style.top = `${containerCenterY}px`;
            joystick2Value.textContent = `Joystick 2: X=${js.valueX}, Y=${js.valueY}`;
        }
    });
    setInterval(fetchAnalogValue, 1000); // Fetch analog value every second
});

joysticks.forEach(js => {
    js.joystick.addEventListener('mousedown', (e) => startDrag(e, js));
    js.joystick.addEventListener('touchstart', (e) => startDrag(e, js), { passive: false });
});

document.addEventListener('mousemove', (e) => drag(e, 'mouse'));
document.addEventListener('touchmove', (e) => drag(e, 'touch'), { passive: false });
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchend', endDrag);

function startDrag(e, js) {
    e.preventDefault();
    js.isDragging = true;
    js.touchId = e.changedTouches ? e.changedTouches[0].identifier : null;
    js.containerRect = js.container.getBoundingClientRect();
}

function drag(e, inputType) {
    e.preventDefault();

    joysticks.forEach(js => {
        if (!js.isDragging) return;

        let touch;
        if (inputType === 'touch') {
            touch = Array.from(e.changedTouches).find(t => t.identifier === js.touchId);
            if (!touch) return;
        } else {
            touch = e;
        }

        const containerCenterX = js.containerRect.width / 2;
        const containerCenterY = js.containerRect.height / 2;

        let x = (inputType === 'touch' ? touch.clientX : e.clientX) - js.containerRect.left - containerCenterX;
        let y = (inputType === 'touch' ? touch.clientY : e.clientY) - js.containerRect.top - containerCenterY;

        const maxRadius = containerCenterX - js.joystick.offsetWidth / 2;

        // Limit joystick within the circular container
        if (Math.sqrt(x * x + y * y) > maxRadius) {
            const angle = Math.atan2(y, x);
            x = maxRadius * Math.cos(angle);
            y = maxRadius * Math.sin(angle);
        }

        js.joystick.style.left = `${x + containerCenterX}px`;
        js.joystick.style.top = `${y + containerCenterY}px`;

        // Calculate joystick values
        js.valueX = Math.round(1497 + ((x / maxRadius) * 500));
        js.valueY = Math.round(1497 - ((y / maxRadius) * 500));  // Inverted Y-axis

        // Update display
        if (js.joystick === joystick1) {
            throttle = js.valueY;
            pitch = js.valueX;
            
            if(throttle < 1010) {
                throttle = 1010;
            }
            if(pitch < 1010) {
                pitch = 1010;
            }
            joystick1Value.textContent = `Joystick 1: X=${pitch}, Y=${throttle}`;            
        } else {
            roll = js.valueY;
            yaw = js.valueX;
            if (roll < 1010) {
                roll = 1010;
            }
            if (yaw < 1010) {
                yaw = 1010;
            }
            joystick2Value.textContent = `Joystick 2: X=${yaw}, Y=${roll}`;  
        }

        // Debounce sending data
        debounceSendData();
    });
}

function endDrag(e) {
    joysticks.forEach(js => {
        if (!js.isDragging) return;

        if (e.changedTouches) {
            const touch = Array.from(e.changedTouches).find(t => t.identifier === js.touchId);
            if (!touch) return;
        }

        js.isDragging = false;
        js.touchId = null;

        const containerCenterX = js.containerRect.width / 2;
        const containerCenterY = js.containerRect.height / 2;

        // Reset to center for x-axis, and conditionally for y-axis
        js.joystick.style.left = `${containerCenterX}px`;
        if (js.resetY) {
            js.joystick.style.top = `${containerCenterY}px`;
            js.valueY = 1497;
        }

        js.valueX = 1497;

        if(js.valueY < 1010) {
            js.valueY = 1010;
        }

        // Update display
        if (js.joystick === joystick1) {
            joystick1Value.textContent = `Joystick 1: X=${js.valueX}, Y=${js.valueY}`;
        } else {
            joystick2Value.textContent = `Joystick 2: X=${js.valueX}, Y=${js.valueY}`;
        }

        // Send reset values
        sendData(throttle, 1497, 1497, 1497);
    });
}

// Recalculate container rect on window resize
window.addEventListener('resize', () => {
    joysticks.forEach(js => {
        js.containerRect = js.container.getBoundingClientRect();
    });
});

let debounceTimeout;
function debounceSendData() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        sendData(throttle, pitch, roll, yaw);
    }, 10); // Send data at most every 100ms
}

async function sendData(t, p, r, y) {
    const data = { throttle: t, pitch: p, roll: r, yaw: y};
    try {
        const response = await fetch('http://10.42.0.143/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();
        console.log('Response:', result);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}


document.getElementById("power").addEventListener("click", function() {
    if(document.getElementById("power").checked == true)
    {
        sendPowerState(1);
    }
    else{
        sendPowerState(0);
    }
    
});

async function sendPowerState(power) {
    const data = { power: power };
    try {
        const response = await fetch('http://10.42.0.143/power', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();
        console.log('Power Response:', result);
    } catch (error) {
        console.error('Error sending power state:', error);
    }
}

async function fetchAnalogValue() {
    try {
        const response = await fetch('http://10.42.0.143/analog', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('Analog Value:', result.analog);
        analogValueDisplay.textContent = `Analog Value: ${result.analog}`;
    } catch (error) {
        console.error('Error fetching analog value:', error);
    }
}