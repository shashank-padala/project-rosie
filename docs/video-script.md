# Project Rosie — 3-Minute Video Script

*Kaggle Gemma4Good · Health & Sciences track · ~450 words · ~3:00 at moderate pace*

---

## [0:00–0:25] Hook

*Visual: photo of Paul Conyngham and Rosie, or the NBC news clip thumbnail*

"In late 2025, Paul Conyngham — a 17-year machine learning veteran — spent three months in a university research lab designing a personalized cancer vaccine for his dog Rosie. By hand. The tumor on her leg shrank 75% in a month. It worked.

Then he asked a question that haunted him: what if he didn't have a research lab? What if he was just a vet?"

---

## [0:25–0:45] The wall

*Visual: terminal output, tool names scrolling, or a dense VCF file*

"The pipeline from a sequenced tumor to a synthesizable mRNA vaccine requires fluency in pVACtools, NetMHCpan, VEP annotation, codon optimization — a half-dozen specialized tools. Vet clinics don't have bioinformaticians on staff.

So dogs that could benefit from this science today, don't. That's the wall."

---

## [0:45–2:15] Demo

*Visual: screen recording of rosie.kiraklabs.com*

"A vet uploads a tumor variant call file. Before the pipeline touches a single CPU, Gemma 4 reads the file's structure and flags issues that would waste six hours of compute."

*Visual: VcfAdvisor fires — warning note appearing*

"Here: no matched-normal column detected. Tumor-only sample. Gemma catches it upfront."

*Visual: submit, show pipeline timeline animating stage by stage*

"The pipeline runs. Each stage fires a live callback — variant annotation, neoantigen prediction, candidate ranking, report generation, mRNA design. No polling. No refresh."

*Visual: pipeline completes, report appears*

"When it finishes, Gemma 4 has read the binding affinity chart, the mutation landscape pie, and the candidate JSON — multimodally — and written a plain-language clinical report. Not a data dump. Something a vet can act on."

*Visual: scroll to sensitivity panel, drag IC50 slider*

"Below the report, the vet moves threshold sliders to see how the candidate pool changes — instantly, client-side. Then asks Gemma to narrate the tradeoff."

*Visual: Gemma narration appears*

"And the full case context is loaded into a conversational assistant."

*Visual: chat widget with a question and answer*

"Six hours. Fifteen dollars in cloud compute. A synthesis-ready mRNA sequence ready to email to a contract manufacturer."

---

## [2:15–2:45] Why Gemma 4 specifically

"Gemma 4 is doing something no deterministic pipeline can: reasoning *around* the science — pre-flight, mid-analysis, in the clinical report — not just summarizing at the end.

And because Gemma 4 is open weights, this pipeline can run entirely on-premise. Patient tumor sequencing data never has to leave the clinic. That matters for veterinary oncology. It will matter more for human trials."

---

## [2:45–3:00] Close

"Dogs get the same cancers humans do — driven by the same mutations in the same genes. Every dog case that runs through this pipeline is, scientifically, pre-clinical comparative oncology data. The playbook for dogs becomes the playbook for humans.

Project Rosie — open source, live at rosie.kiraklabs.com."

---

## Production notes

- **Open on Paul/Rosie, not the dashboard.** The 30-second hook needs to land emotionally before any UI appears. Impact & Vision is 40 points — judges need to feel the problem first.
- **Demo order:** VcfAdvisor warning → pipeline timeline animating → report → sensitivity slider → Gemma narration → chat widget. Show the full advisor loop, not just the completed report.
- **On-premise line matters.** The track description explicitly calls out "a medical site far from a data center" and "privacy is non-negotiable" — land the open-weights / on-premise point clearly.
- **End on the translational medicine close.** "Playbook for dogs becomes the playbook for humans" is the line that earns points on vision — don't bury it.
