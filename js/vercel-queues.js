/* Queues for Vercel Web Analytics and Speed Insights, so calls made before
   their scripts load aren't lost. Lives in a file (not inline) so the
   Content-Security-Policy in vercel.json can block every inline script. */
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };
