const res = await fetch("http://localhost:3000/business-hub/bole-fish-king-ph");
console.log("Status:", res.status);
const text = await res.text();
console.log("Length:", text.length);
console.log("Title snippet:", text.slice(text.indexOf("<title>"), text.indexOf("</title>") + 8));
console.log("Contains Bole:", text.includes("Bole"));
console.log("Contains Fish:", text.includes("Fish"));
console.log("Contains King:", text.includes("King"));
