const url = "https://nhqomxlttffnaomlprlc.supabase.co/rest/v1/invites?select=*,schools(*)";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ocW9teGx0dGZmbmFvbWxwcmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjY1NTQsImV4cCI6MjA5NDMwMjU1NH0.NKGK2kYf7QfBGxFveHDFKVHUF_7TVaZP0bd028X-NiI";

fetch(url, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`
  }
})
.then(res => res.json())
.then(data => {
  const cristalinoInvites = data.filter(inv => inv.schools && inv.schools.name && inv.schools.name.toLowerCase().includes('cristalino'));
  console.log("All invites for Cristalino:", JSON.stringify(cristalinoInvites, null, 2));
});
