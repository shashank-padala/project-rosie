# Project Rosie — 3-Minute Demo Video Script

*Gemma4Good · Health & Sciences track · Hackathon submission*

---

## Production Overview

**Total runtime:** 3:00
**Format:** 2D animated cartoon + real screen recording + optional expert clips
**Art style:** Warm flat 2D illustration — think early Pixar short or Adventure Time. Soft yellows, teals, warm oranges. Not photorealistic.
**Tone:** Documentary warmth. Not a product pitch. A story about a real problem and a real solution.
**Voice-over:** Single narrator, calm and purposeful. No hype.
**Music:** Minimal piano + soft ambient throughout. Gentle swell at Scene 7. Fades under expert clips.

---

## Scene 1 — The Clinic [0:00–0:15] ANIMATION

**Visual:** Wide establishing shot of a cozy 2D animated veterinary clinic. Examination table, anatomical dog poster on the wall, cabinet of supplies. Warm late-afternoon light. A TV is mounted on the wall, quietly playing a news segment. The waiting room is visible through a doorway — a figure sits slumped in a chair.

*No narration. No dialogue. Camera slowly pushes in toward the TV.*

---

## Scene 2 — The News [0:15–0:35] ANIMATION + REAL PHOTO

**Visual:** The TV fills the frame. A stylized news graphic — not real NBC footage. A chyron reads:

> **"ML Engineer Saves Dying Dog with Personalized Cancer Vaccine"**

Above the chyron: a real photograph of Paul Conyngham and Rosie, displayed inside the cartoon TV frame. The photo is not animated — it sits as a real image in a cartoon world. This contrast is intentional.

**VO:**
> "In late 2025, an AI engineer in Australia spent three months in a university research lab designing a personalized cancer vaccine for his dog. By hand. The tumor shrank 75%. It worked."

*Cut to: the vet in the clinic, sitting on a stool, watching the TV. Eyes wide.*

---

## Scene 3 — The Waiting Room [0:35–0:50] ANIMATION

**Visual:** The vet walks out to the waiting room. A dog owner — a woman, mid-40s — sits hunched over, holding a scruffy dog in her lap. She's quietly crying. The dog nuzzles her chin.

*The vet pauses. Looks at the dog. Glances back toward the TV, still audible in the background. Close-up on the vet's face — a thought forming.*

**VO:**
> "6 million dogs are diagnosed with cancer every year in the United States. None of them have access to a personalized vaccine."

---

## Scene 4 — The Wall [0:50–1:05] ANIMATION

**Visual:** The vet at a desk, late at night. Computer screen glowing blue. He's searching — the screen fills with tool names stacking up: `pVACtools`, `VEP`, `NetMHCpan`, `GATK Mutect2`, `Slurm HPC setup`... Terminal windows multiplying. The clock on the wall reads 2:00 AM. He slumps back, overwhelmed.

*Then — a new tab. A search result appears:*

**"Project Rosie — AI Clinical Assistant for Oncologists"**
`rosie.kiraklabs.com`

*He leans forward. Clicks. The screen glows warmer.*

**VO:**
> "The tools to do what Paul did already exist. What didn't exist was the infrastructure connecting them — and an AI that could guide a clinician through the output. Until now."

---

## Scene 5 — The Demo [1:05–2:05] REAL SCREEN RECORDING

*Cut to actual rosie.kiraklabs.com. Clean screen recording, no cartoon overlay. Cursor hidden during narration beats.*

**[1:05–1:14]** Landing page → submit form, VCF file selected

**VO:**
> "A vet uploads the tumor sequencing file."

---

**[1:14–1:25]** VcfAdvisor fires — advisory note appears inline

**VO:**
> "Before anything runs, Gemma 4 reads the file's structure and flags issues that could waste six hours of compute. Here: tumor-only sample, no matched normal. Flagged upfront. Submit still works — nothing is blocked."

---

**[1:25–1:40]** Pipeline timeline animating stage by stage

**VO:**
> "The pipeline runs on cloud infrastructure. Each stage fires a live update — annotation, neoantigen prediction, candidate ranking, report generation, mRNA design. No polling. No refresh."

---

**[1:40–1:50]** Clinical report visible — scroll to show candidate table + binding affinity chart

**VO:**
> "Gemma 4 reads the binding affinity charts, the mutation landscape, and the candidate data — multimodally — and writes a plain-language clinical report. Something a vet can act on without a bioinformatician in the room."

---

**[1:50–1:57]** Sensitivity panel — IC50 slider drag, Gemma narration appears

**VO:**
> "The vet adjusts thresholds. Gemma explains the clinical tradeoff in plain English, on demand."

---

**[1:57–2:05]** Chat widget open with a question answered; download buttons visible (clinical report PDF, synthesis spec)

**VO:**
> "The full case is available as a conversational assistant. The output: a clinical report and a synthesis specification — ready to email to an RNA manufacturing lab."

---

## Scene 6 — The Lab Chain [2:05–2:20] ANIMATION

**Visual:** Back to cartoon. The vet at his desk, clicks "Download." An email swoosh — the files fly off the screen with a satisfying animation.

*Cut to: a cartoon RNA synthesis lab. Scientists in white coats. A large monitor shows a mRNA sequence. A vial being sealed under a clean hood. A courier box — "FRAGILE — BIOLOGICAL MATERIAL" — handed to a delivery driver.*

*No narration. The visual chain does the work.*

---

## Scene 7 — The Happy Ending [2:20–2:35] ANIMATION

**Visual:** Back to the vet clinic. The vet administers a small injection to the scruffy dog. The dog owner holds the dog's paw, eyes closed.

*Time-lapse: a wall calendar. Pages turn. "Week 2." "Week 4." "Week 8."*

*Final frame: a sunny park. The dog — visibly healthy, tail wagging — bounds across the grass. The dog owner is laughing, chasing after it. She scoops the dog up. Both of them lit by afternoon sun.*

**VO:**
> "It took one ML veteran three months to save one dog. Now any vet oncologist can do it in six hours."

*Beat of silence.*

---

## Scene 8 — The Pitch [2:35–2:50] ANIMATION + TEXT

**Visual:** Clean dark background. Animated text appears, word by word, in the teal brand color.

**"6 million dogs. One pipeline. $15 per case."**

**VO:**
> "Dogs get the same cancers humans do — driven by the same mutations in the same genes. Every canine case that runs through this pipeline is pre-clinical comparative oncology data. The playbook for dogs becomes the playbook for humans."

*Final card:*

```
Project Rosie
AI Clinical Assistant for Oncologists
Starting with the patients who can't speak for themselves.

rosie.kiraklabs.com  ·  Open source
github.com/shashank-padala/project-rosie
```

---

## Scene 9 — Expert Voices [2:50–3:00] REAL VIDEO (if available)

**Visual:** Real video clips. Lower-third name and title overlay on each. Warm fade in/out.

*If two clips: ~5 seconds each.*
*If one clip: 8–10 seconds.*

*No narrator voice-over — let the experts speak uninterrupted.*

---

## Production Notes

**Scene 2 — Real photo inside cartoon TV:**
Use the Paul/Rosie photo from padala.ai/blog or any publicly available source. The photo sits as a real image inside the animated TV frame — not illustrated. This "real world inside cartoon world" contrast is the visual hook of the whole piece.

**Scene 5 — Screen recording:**
- Record at 1920×1080. Use the public demo at `rosie.kiraklabs.com/demo` — no login required, canine mammary case already loaded.
- Pre-navigate to the completed case so the pipeline timeline is already showing "completed" — don't make judges watch a real-time 6-hour wait.
- For the VcfAdvisor beat, record the submit flow separately with a tumor-only VCF that triggers the advisory note.
- Hide cursor during VO beats; move it only to highlight UI elements.
- Loom works fine for capture. Export at highest quality.

**Expert clips:**
- Film horizontally, 720p minimum, good natural or ring light.
- Ask each person to state their name and title at the start (for the lower-third sync).
- No script — their own words. The two-part question: (1) what does this normally take in a research setting, (2) what does a clinical AI assistant do for how a clinician acts on the output.

**Music:**
- Scene 1–4: Soft, slightly anxious ambient piano (problem framing)
- Scene 5: Neutral/clean (demo needs to breathe, not compete with music)
- Scene 6–7: Warmth builds
- Scene 7 final park shot: swell
- Scene 8: Clean, minimal
- Scene 9: Fade out
