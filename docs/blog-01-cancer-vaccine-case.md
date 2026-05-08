# A man used ChatGPT and AlphaFold to design a cancer vaccine for his dying dog. It worked. Here is how to replicate it.

*The tools exist. The science is proven. The infrastructure does not. I am building it as an open source project and anyone is welcome to join.*

*Published: April 9, 2026 — padala.ai*

---

In December 2025, a dog named Rosie received an injection at a veterinary clinic in Gatton, Australia. The injection was a personalized mRNA cancer vaccine, designed by her owner using free AI tools, manufactured in under two months by university researchers who had never done anything like this before. A month later, the tennis-ball-sized tumor on her leg had shrunk by 75%.

The researchers who helped make it said: *"It raises the question, if we can do this for a dog, why aren't we rolling this out to all humans with cancer?"*

That question has been living rent-free in my head ever since.

> "The tools already exist. What does not exist is the software infrastructure that connects them into a repeatable, accessible pipeline."

---

## What Paul Conyngham actually did

Paul Conyngham is a Sydney-based machine learning engineer with 17 years of experience and zero background in biology. When his rescue dog Rosie was diagnosed with terminal mast cell cancer, he refused to accept the prognosis.

He spent $3,000 to have Rosie's tumor DNA and healthy DNA sequenced at the University of New South Wales. He used ChatGPT to navigate unfamiliar biomedical literature. He used Google DeepMind's AlphaFold to model the 3D structure of the mutated protein driving Rosie's cancer. He used Grok to design an mRNA sequence that would teach Rosie's immune system to recognize and attack that protein. He handed a half-page formula to Professor Pall Thordarson at UNSW's RNA Institute, who manufactured the physical vaccine in under two months.

It was the first personalized cancer vaccine ever designed for a dog.

> **Important caveat**: Rosie was simultaneously receiving a PD-1 inhibitor, a standard immunotherapy drug, which makes it impossible to isolate exactly what drove the tumor shrinkage. This was one dog, one tumor, no controlled trial. The story is real and remarkable but should be understood as proof of concept, not proof of cure.

---

## Why this is bigger than one dog

What Conyngham demonstrated in a few months, working nights and weekends, is a compressed version of exactly what Moderna and Merck are spending billions to industrialize for human cancer patients. Their Phase 3 personalized melanoma vaccine trial showed a 49% reduction in cancer recurrence or death at five-year follow-up. First commercial approvals are expected around 2026 to 2028.

The biology is the same. The tools are the same. The difference is scale, rigor, and the regulatory pathway that turns a research experiment into a treatment that can be prescribed to any patient.

But here is what struck me. Every tool Conyngham used is open source and free. GATK from the Broad Institute. NetMHCpan from the Technical University of Denmark. AlphaFold from Google DeepMind. LinearDesign from Baidu Research. pVACtools from Washington University School of Medicine. The science is not locked away. What does not exist is the software infrastructure that connects these tools into a pipeline that anyone with a sequencing file can run.

---

## The pipeline, explained for non-biologists

**Step 1 — You receive two DNA sequencing files.**
One from the tumor, one from healthy tissue. These are FASTQ files containing millions of short DNA fragments read by a sequencing machine.

**Step 2 — The software compares tumor DNA against healthy DNA.**
Using tools like GATK, it aligns both to the reference genome and finds every position where the tumor has a different DNA letter. These are somatic mutations — changes that happened only in the cancer cells.

**Step 3 — AI predicts which mutations produce a neoantigen.**
Not every mutation is useful. The software uses neural networks like NetMHCpan to predict which mutant protein fragments will be displayed on the cancer cell surface as a flag the immune system can recognize. These are neoantigens. Most mutations produce nothing useful. A few produce exactly the target you want.

**Step 4 — AlphaFold validates the structural candidates.**
For the top 20 candidates, AlphaFold predicts the 3D protein structure to confirm the mutated region is actually on the surface of the protein and accessible to the immune system. A buried mutation is useless regardless of how good its other scores are.

**Step 5 — The software designs the mRNA instruction.**
Using LinearDesign and canine codon optimization tables, it writes the mRNA sequence that will teach the immune system to recognize the selected neoantigens. The output is a text file ready for an RNA synthesis lab to manufacture.

> "Steps 2, 3, 4, and 5 are entirely software. They run on a laptop or a cloud instance. They cost roughly $15 in compute. And right now, there is no product that does this end to end."

---

## Why the veterinary market is the right place to start

Cancer is the leading cause of death in dogs over age 10. Roughly 6 million dogs are diagnosed annually in the US alone. Pet owners are already spending $10,000 to $30,000 on conventional cancer treatment. No personalized cancer vaccine exists anywhere in the veterinary market today.

More importantly, the regulatory environment for experimental veterinary treatments is dramatically lighter than for human medicine. Conyngham spent three months on ethics paperwork in Australia, which is genuinely painful, but it is nothing compared to the decade-long FDA approval pathway for a human drug. In Canada, the path for veterinary compassionate use cases is navigable.

Dogs also get the same cancers humans do. Mast cell tumors, lymphoma, osteosarcoma, melanoma. Their immune systems work on the same principles. The comparative oncology literature already shows that canine clinical trials predict human responses better than mouse models. Every dog case that runs through this pipeline is, in a meaningful scientific sense, pre-clinical human data collected in a real patient with a real cancer, without needing FDA authorization to run it.

The playbook for dogs becomes the playbook for humans. The data you accumulate makes the AI ranking models more accurate. The partner network you build translates directly. The regulatory pathway to humans opens because you have published outcomes in peer-reviewed journals. This is the on-ramp.

---

## What I am building

I am the founder of Kirak Labs, an AI product studio in Toronto. I have no biotech background. I am building this for the same reason Conyngham built his version: because the tools exist, the need is obvious, and no one has packaged them yet.

The project is called Rosie. The core software pipeline will be open source on GitHub. It includes: a Nextflow bioinformatics pipeline that takes two FASTQ files in and produces a synthesis-ready mRNA sequence file out. Modules for alignment (BWA-MEM2), mutation calling (GATK Mutect2 + VarScan2), neoantigen prediction (pVACtools, NetMHCpan, DeepImmuno, PyClone), AlphaFold validation, and mRNA design (LinearDesign with canine codon tables). Docker containers for every tool. A case management API. A clinician-facing report generator. And a complete technical playbook.

The proprietary layer that sits on top of this open source foundation is the outcome-trained neoantigen ranking model. Every case that runs through the pipeline and produces follow-up data makes that model more accurate. That accumulated data is the actual competitive moat. The pipeline itself I am happy to share with the world.

---

## What the long vision looks like

The immediate goal is to run real canine cases in partnership with vet oncology clinics and university labs in Toronto, accumulate outcome data, and publish results. The medium-term goal is to use those results to bridge into human comparative oncology research under academic partnerships. The long-term goal: distributed micro vaccine labs, running on this software as the operating system, able to design a personalized treatment for any patient with any cancer, at a cost that makes it accessible rather than a privilege for the wealthy.

Moderna and Merck's personalized cancer vaccine for humans is projected to generate over $10 billion in annual revenue by 2030. The infrastructure that powers it — the mutation calling, the neoantigen prediction, the mRNA design — will be worth building at every layer of the stack. I want to build the layer that no one else is focused on: the one that makes it work for a vet in Mississauga, a clinic in Mumbai, a hospital in Nairobi.

The same four technology curves that made Rosie's vaccine possible are still converging. Sequencing costs are still falling. AI models are still improving. mRNA synthesis is still being miniaturized. LNP manufacturing is still getting cheaper. The question is not whether this world arrives. It is who builds the infrastructure when it does.

---

*Shashank Padala is the founder of Kirak Labs, an AI product studio in Toronto. He writes about AI, biotech infrastructure, and building at the frontier of personalized medicine.*

Tags: #PersonalizedMedicine #CancerResearch #mRNAVaccines #AIBiotech #VeterinaryOncology #OpenSource #Bioinformatics #KirakLabs #ProjectRosie #ComparativeOncology
