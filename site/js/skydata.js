// Her birth sky as numbers. These were calculated, not typed from memory.
// Tool: PyEphem 4.2.1, run in the assistant's workspace (the scripts are in docs/tools/).
// Moment: 30 October 2002, 5:00 pm, Beni Mellal (32.3373 N, 6.3498 W). Morocco was on UTC+0 that day.
// "lon" is the position on the zodiac circle in degrees, 0 to 360 (0 = start of Aries), measured the
// tropical way, the one astrologers use. "house" uses the simple whole-sign way.
// The rising sign and houses depend on the exact minute of birth. 5:00 pm was used.

export const CHART = {
  bodies: [
    { name: "Sun", lon: 217.11, retro: false },
    { name: "Moon", lon: 145.9, retro: false },
    { name: "Mercury", lon: 207.95, retro: false },
    { name: "Venus", lon: 218.39, retro: true },
    { name: "Mars", lon: 189.57, retro: false },
    { name: "Jupiter", lon: 136.22, retro: false },
    { name: "Saturn", lon: 88.75, retro: true },
    { name: "Uranus", lon: 324.92, retro: true },
    { name: "Neptune", lon: 308.23, retro: false },
    { name: "Pluto", lon: 256.01, retro: false },
  ],
  asc: 25.74, // the rising sign point (east horizon)
  mc: 286.12, // the top of the sky (south, the middle of the sky)
};
