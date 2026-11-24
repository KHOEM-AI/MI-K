# GLB Export (ភូមិ សាលា សត្វ ផ្ទះ ផ្លូវ ឧបករណ៍)

ស្គ្រីបតែមួយ export វត្ថុទាំងអស់ពី MI-K ទៅជា `.glb`។

```bash
npm install                       # ដំឡើង three និង tsx
npm run glb:list                  # មើលបញ្ជី (មិនសរសេរអ្វី)
npm run glb:all                   # export ទាំងអស់ + ពិភពភូមិមួយឯកសារ
npx tsx scripts/export-world-glb.mjs --only=animals
```

លទ្ធផល (`exports/world/`, មិនចូល Git):

| ទីតាំង | មាតិកា |
|---|---|
| `houses/` `buildings/` `roads/` `school/` | ផ្ទះ អគារ ផ្លូវ សាលា |
| `animals/` `people/` `vehicles/` | សត្វ មនុស្ស យានយន្ត |
| `farm/` `nature/` `tools/` | ចម្ការ ធម្មជាតិ ឧបករណ៍ |
| `world/mi-k-village.glb` | ភូមិទាំងមូលក្នុងឯកសារតែមួយ |
| `index.json` | របាយការណ៍៖ ជោគជ័យ បរាជ័យ រំលង |

បន្ថែមវត្ថុថ្មី៖ បន្ថែមមួយបន្ទាត់ក្នុង `scripts/world-catalog.mjs`។

សម្គាល់៖ ផ្ទះ ៣០០ (InstancedMesh) ត្រូវបំប្លែងជា mesh ធម្មតាមុន export ដូច្នេះឯកសារភូមិអាចធំ។
