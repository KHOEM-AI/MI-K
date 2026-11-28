# មនុស្សពិត (GLB មានឆ្អឹង) ៖ កែកម្ពស់ បញ្ចូលចលនា

ឧបករណ៍៖ `scripts/glb-rig-tool.mjs` (មិនត្រូវការ three.js មិនកែឯកសារដើម)

```bash
# មើលព័ត៌មាន៖ ឆ្អឹង ម្រាមដៃ កម្ពស់ ចលនា blendshape មុខ
node scripts/glb-rig-tool.mjs inspect public/characters/fashion-model.glb [--bones]

# កម្ពស់ថ្មី (ម៉ែត្រ) និង/ឬ ពណ៌ស្បែកខ្មៅជាង
node scripts/glb-rig-tool.mjs edit public/characters/fashion-model.glb exports/man.glb --height 1.70 --tint "#c99672"

# បញ្ចូលចលនាពីឯកសារផ្សេងៗចូលម៉ូដែលតែមួយ (ផ្គូផ្គងតាមឈ្មោះឆ្អឹង)
node scripts/glb-rig-tool.mjs merge public/characters/fashion-model.glb exports/walker.glb \
   idle=Idle.glb walk=Walking.glb talk=Talking.glb --drop-existing --in-place=walk

# កម្ពស់ ៥ ទំហំ ហើយមើលក្នុង viewer
node scripts/glb-rig-tool.mjs variants public/characters/fashion-model.glb exports/people/real
```

មើលក្នុង viewer៖ `cd exports/people && python3 -m http.server 8000` ហើយបើក
`http://localhost:8000/viewer.html` (ឬ `viewer.html?file=real/ឈ្មោះ.glb`)។

## យកចលនាមកពីណា
- Mixamo ផ្ដល់ចលនាថតពីមនុស្សពិត (Idle, Walking, Running, Waving, Talking)។ វា export ជា **FBX** ដូច្នេះត្រូវបម្លែងជា GLB (Blender ឬ website បម្លែង)។ ជ្រើស "Without Skin" ដើម្បីឱ្យឯកសារតូច។
- ឆ្អឹងត្រូវមានឈ្មោះ `mixamorig:...` ដូចគ្នា។ បើមិនដូចគ្នា ឧបករណ៍នឹងប្រាប់ "none of its bones exist"។
- `--in-place` ឱ្យតួដើរនៅនឹងកន្លែង (ឱ្យ game ផ្លាស់ទីខ្លួនឯង)។

## ដែនកំណត់
- កម្ពស់ជាការពង្រីកទាំងមូល៖ មនុស្សធំតូចជាង ≠ កុមារពិត (សមាមាត្រក្បាលខុស)។
- `--tint` គុណលើ texture ទាំងមូល (សម្លៀកបំពាក់ក៏ងងឹតដែរ) ហើយអាចតែធ្វើឱ្យងងឹត។ ពណ៌ស្បែកចម្រុះពិត ត្រូវការ texture ផ្សេងៗ។
- `fashion-model.glb` គ្មាន blendshape មុខ ដូច្នេះមិនអាច lip sync បាន។
