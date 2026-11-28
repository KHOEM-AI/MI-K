# មនុស្សមានចលនា (GLB)

```bash
npm run people:list            # មើលបញ្ជី (មិនសរសេរអ្វី)
npm run people:all             # មនុស្ស ១៤ នាក់ + lineup.glb
npm run people:skins           # បន្ថែម៖ បុរស និងស្ត្រី គ្រប់ពណ៌ស្បែក (១២ ឯកសារ)
npm run people:test            # តេស្តរួមទាំង rig និងចលនា
```

លទ្ធផលនៅ `exports/people/`៖ `<id>.glb`, `lineup.glb`, `skins/`, `index.json`, `viewer.html`។

| ចលនាក្នុងឯកសារនីមួយៗ | |
|---|---|
| `idle` | ឈរ ដកដង្ហើម ផ្លាស់ទំងន់ |
| `walk` / `run` | ដើរ / រត់ (ជើងប៉ះដី ដៃយោលផ្ទុយជើង) |
| `wave` | គ្រវីដៃស្ដាំ |
| `talk` | កាយវិការដៃ ក្បាលងក់ពេលនិយាយ |

មើលលើទូរសព្ទ (ត្រូវការអ៊ីនធឺណិតសម្រាប់ទាញ three.js ពី CDN)៖
```bash
cd exports/people && python3 -m http.server 8000
```
ហើយបើក `http://localhost:8000/viewer.html`។ ឬ import `.glb` ទៅ Blender។

បន្ថែមមនុស្សថ្មី៖ បន្ថែមមួយបន្ទាត់ក្នុង `scripts/people-catalog.mjs` (កម្ពស់ជាម៉ែត្រ ពណ៌ស្បែកជាឈ្មោះ)។
កែចលនា៖ `scripts/people-motion.mjs`។

ដែនកំណត់៖ ជាតួ low-poly គ្មានមាត់ឬ lip sync គ្មានចលនាម្រាមដៃ ហើយចលនាជា "នៅនឹងកន្លែង" (ឱ្យ game/Village ផ្លាស់ទីតួខ្លួនឯង)។
