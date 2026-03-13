const BASE = "http://localhost:3000"

async function main() {
  const [svcsRes, catsRes, prodsRes, artistsRes, pkgsRes] = await Promise.all([
    fetch(`${BASE}/api/services`).then(r => r.json()),
    fetch(`${BASE}/api/services/get-categories`).then(r => r.json()),
    fetch(`${BASE}/api/products/get-all-products`).then(r => r.json()),
    fetch(`${BASE}/api/artists`).then(r => r.json()),
    fetch(`${BASE}/api/services/get-packages`).then(r => r.json()),
  ])

  const svcs = Array.isArray(svcsRes) ? svcsRes : []
  const cats = Array.isArray(catsRes) ? catsRes : []
  const prods = Array.isArray(prodsRes) ? prodsRes : []
  const artists = Array.isArray(artistsRes) ? artistsRes : []
  const pkgs = Array.isArray(pkgsRes) ? pkgsRes : []

  const catMap = {}
  cats.forEach(c => { catMap[c.id] = c.name })

  console.log("=== CATEGORIES (" + cats.length + ") ===")
  cats.forEach(c => console.log("  " + c.name))

  console.log("\n=== SERVICES BY CATEGORY ===")
  const grouped = {}
  svcs.forEach(s => {
    const cat = catMap[s.category_id] || "Uncategorized"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })
  Object.entries(grouped).forEach(([cat, items]) => {
    console.log("\n" + cat + " (" + items.length + "):")
    items.forEach(s => {
      console.log("  £" + s.base_price + " | " + s.duration + "min | " + s.name)
    })
  })

  console.log("\n=== PRODUCTS (" + prods.length + ") ===")
  const prodCats = {}
  prods.forEach(p => {
    if (!prodCats[p.category]) prodCats[p.category] = []
    prodCats[p.category].push(p)
  })
  Object.entries(prodCats).forEach(([cat, items]) => {
    console.log("\n" + cat + " (" + items.length + "):")
    items.forEach(p => console.log("  £" + p.price + " | " + p.name))
  })

  console.log("\n=== ARTISTS (" + artists.length + ") ===")
  artists.forEach(a => console.log("  " + (a.display_name || a.name || a.id)))

  console.log("\n=== PACKAGES (" + pkgs.length + ") ===")
  pkgs.forEach(p => console.log("  " + p.name + " — " + p.discount_percent + "% off"))

  // Check expected seed data
  console.log("\n=== VALIDATION ===")
  const expectedSvcs = [
    "Small Tattoo", "3 Tats Bundle", "Fine Line Tattoo", "Midsize Tattoo",
    "Cover Up Tattoo", "Full Day Tattoo", "Half Sleeve Tattoo", "Full Sleeve Tattoo",
    "Lobe Piercing", "Nose Piercing", "Any Ear Piercing", "Eyebrow Piercing",
    "Belly Button Piercing", "Tongue Piercing", "Septum Piercing", "Surface Piercing",
    "Dermal Piercing", "Snake Eyes Piercing", "Kids Lobe Piercing", "Back Dermals x2",
    "Classic Lash Extensions", "Volume Lash Extensions", "Lash Lift & Tint",
    "Lip Blush", "Microblading", "Lip Contour PMU", "Natural Lash Line",
    "Tattoo Course", "Piercing Course"
  ]

  const svcNames = new Set(svcs.map(s => s.name))
  const missing = expectedSvcs.filter(n => !svcNames.has(n))
  const extra = svcs.filter(s => !expectedSvcs.includes(s.name))

  if (missing.length > 0) {
    console.log("MISSING services (" + missing.length + "):")
    missing.forEach(n => console.log("  - " + n))
  } else {
    console.log("All 29 expected services present ✓")
  }

  if (extra.length > 0) {
    console.log("EXTRA services (" + extra.length + "):")
    extra.forEach(s => console.log("  + " + s.name))
  }

  const expectedProds = [
    "Piercing Care Solution", "Tattoo Aftercare Cream", "Tattoo Aftercare Kit",
    "SPF50 Tattoo Sunscreen", "Antibacterial Soap Bar", "Titanium Piercing Jewellery",
    "Gold Plated Nose Ring", "Midnight Branded Tee",
    "Gift Card — £15", "Gift Card — £50", "Gift Card — £100",
    "Gift Card — £200", "Gift Card — £350", "Gift Card — £750"
  ]

  const prodNames = new Set(prods.map(p => p.name))
  const missingProds = expectedProds.filter(n => !prodNames.has(n))
  if (missingProds.length > 0) {
    console.log("MISSING products (" + missingProds.length + "):")
    missingProds.forEach(n => console.log("  - " + n))
  } else {
    console.log("All 14 expected products present ✓")
  }

  const expectedCats = ["Tattoo", "Piercing", "Eyelash", "Micropigmentation", "Course"]
  const catNames = new Set(cats.map(c => c.name))
  const missingCats = expectedCats.filter(n => !catNames.has(n))
  if (missingCats.length > 0) {
    console.log("MISSING categories: " + missingCats.join(", "))
  } else {
    console.log("All 5 expected categories present ✓")
  }

  // Check for orphaned services (no category)
  const orphaned = svcs.filter(s => !s.category_id || !catMap[s.category_id])
  if (orphaned.length > 0) {
    console.log("ORPHANED services (no valid category):")
    orphaned.forEach(s => console.log("  ! " + s.name + " [cat_id: " + s.category_id + "]"))
  } else {
    console.log("No orphaned services ✓")
  }

  console.log("\n=== SUMMARY ===")
  console.log("Categories: " + cats.length + "/5")
  console.log("Services: " + svcs.length + "/29")
  console.log("Products: " + prods.length + "/14")
  console.log("Artists: " + artists.length)
  console.log("Packages: " + pkgs.length)
}

main().catch(console.error)
