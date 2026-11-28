# រូប 2D → 3D → GLB

ប៊ូតុង `ImageTo3D` ហៅ `POST /api/image-to-3d`។ route នេះមិនមានក្នុង Vite ទេ ដូច្នេះត្រូវមាន server តូចមួយ (`server/image-to-3d.mjs`)។

## ចាប់ផ្ដើម (សាកល្បងមុន ដោយគ្មាន AI)
```bash
npm run i23d:server            # port 8787, provider = mock
```
**mock** ត្រឡប់ឡានប្រអប់សាកល្បង ដែលសម្គាល់ថា `TEST_PLACEHOLDER_NOT_AI` មិនមែនបង្កើតពីរូបភាពទេ។ UI បង្ហាញការព្រមានពណ៌លឿង។

ភ្ជាប់ Vite ទៅ server៖ បើក `nano vite.config.ts` ហើយក្នុង `server.proxy` បន្ថែម
```ts
"/api/image-to-3d": "http://127.0.0.1:8787",
```
រួច restart `npm run dev`។ (ឬផ្ដល់ `endpoint="http://127.0.0.1:8787/api/image-to-3d"` ដល់ component)

## AI ពិត (TRELLIS លើ Hugging Face Space)
```bash
npm install @gradio/client
I23D_LONGEST_M=4.8 npm run i23d:server:trellis
# ជម្រើស៖ HF_TOKEN=hf_xxx  HF_SPACE=JeffreyXiang/TRELLIS  I23D_TIMEOUT_S=420
```
- ត្រូវការអ៊ីនធឺណិត ហើយ Space ឥតគិតថ្លៃអាចដេក ឬត្រូវរង់ចាំជួរ (ច្រើននាទី) ឬខូច។ ពេលនោះ server ប្រាប់កំហុសច្បាស់ មិនដែលបោកប្រាស់ដោយឱ្យម៉ូដែលក្លែងក្លាយទេ។
- ឈ្មោះ endpoint របស់ Space (`/start_session`, `/preprocess_image`, `/image_to_3d`, `/extract_glb`) មកពីឯកសារសាធារណៈ ហើយ **ខ្ញុំមិនទាន់សាកល្បងលើ Space ពិតទេ** (ការតភ្ជាប់ត្រូវបានសាកល្បងជាមួយ client ក្លែង)។ បើបរាជ័យ សូមផ្ញើសារកំហុសមក។
- លទ្ធផលរក្សាទុកក្នុង `exports/image-to-3d/` (ក្រៅ Git) ហើយតម្កល់លើដី ដាក់កណ្ដាល ហើយបើកំណត់ `I23D_LONGEST_M` នឹងបង្រួមទៅទំហំពិត (ឧ. ឡាន ៤.៨ ម៉ែត្រ)។

## សុវត្ថិភាព
server ស្ដាប់តែ 127.0.0.1, ទទួលតែ PNG/JPEG/WebP ≤ 10 MB (ពិនិត្យពី byte មិនមែនឈ្មោះឯកសារ), ទទួលតែ page ក្នុងម៉ាស៊ីននេះ, ធ្វើម្ដងមួយក្នុងមួយពេល, token មិនចេញទៅ browser, ហើយទាញម៉ូដែលចេញពី huggingface/hf.space តែប៉ុណ្ណោះ។

## អ្វីដែលរូបតែមួយមិនអាចធ្វើបាន (សូមដឹងមុនរំពឹង)
- AI គ្រាន់តែ "ទាយ" ផ្នែកដែលមើលមិនឃើញ (ក្រោយ ក្រោម ផ្នែកម្ខាងទៀត)។
- ឡានភ្លឺរលោង កញ្ចក់ ហើយកង់ ជាផ្នែកពិបាកបំផុត៖ ជាធម្មតាលទ្ធផលរដុប កញ្ចក់/កង់មិនច្បាស់ ហើយមិនមែនប្រភេទឡាន (Maserati ។ល។) ពិតប្រាកដទេ។
- ចង់បានម៉ូដែលត្រឹមត្រូវ៖ ប្រើរូបច្រើនមុំ (photogrammetry) ឬម៉ូដែលដែលមានអាជ្ញាបណ្ណ។ ពិនិត្យអាជ្ញាបណ្ណរូប/ម៉ូដែលមុនប្រើពាណិជ្ជកម្ម (TRELLIS = MIT, Hunyuan3D មានលក្ខខណ្ឌតំបន់)។
