async function sendData(t,p,r,y) {
    const data = { throttle: t, pitch: p, roll: r, yaw: y};
    const response = await fetch('http://10.42.0.143/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.text();
    console.log('Response:', result);
  }