const res = await fetch("http://localhost:3000/jobs/senior-solar-inverter-battery-technician-ph");
console.log("Status:", res.status);
const text = await res.text();
console.log("Length:", text.length);
console.log("Has title:", text.includes("Senior Solar Inverter & Battery Storage Technician"));
console.log("Snippet:", text.slice(0, 500));
