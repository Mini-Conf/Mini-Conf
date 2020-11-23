### Track Chairs
- Dr. Tom Pollard
- Dr. Bobak Mortazavi
- Dr. Andrew Beam
- Dr. Uri Shalit

### Description
The goal of this track is to highlight works applying robust methods, models, or practices to identify, characterize, audit, evaluate, or benchmark machine learning systems in applied healthcare settings. These include examples of systems deployed in practice, and datasets used to empirically evaluate these systems.

### Areas of Interest
All areas of machine learning and all types of data within healthcare are relevant to this track. An example set of topics of interest and exemplar papers are shown below. These examples are by no means exhaustive and are meant as illustration and motivation. Submit your work here if the contribution is one of the following:

1. Focused on solving a carefully motivated problem grounded in an application,
2. Focused on a deployment of a system.
3. Describes data or software packages.

Introducing a new method is not prohibited by any means for this track, but the focus should be on methods which are designed to work in a robust manner in real-world applications (e.g., fail gracefully in practice), work that highlights approaches that scale particularly well either in terms of computational efficiency or data required, and work that succeeds across real-world data modalities and systems. In other words, we want compelling demonstrations of systems that address real world problems in healthcare.These include careful examinations of ML systems on real-world data, comparison of performance in cohort analysis, challenges in application development, tools for dataset shift, adversarial shift, personalization, and models on remote and wearable health.

This track also welcomes submissions of significant computer software which support healthcare research and applications. Submissions should describe the intended use for the software, justify the need for the software, provide executable examples for other researchers, and adhere to best practices in software development where possible, including the use of unit tests, continuous integration, and diligent documentation of component design and purpose. Software submissions should directly support a healthcare application. All computer software submissions must be open source and released under a suitable open source license.

**Example papers**

Careful examinations of the robustness of ML systems to real-world dataset shift, adversarial shift, or on minority subpopulations.

* Nestor, Bret, et al. “Feature Robustness in Non-Stationary Health Records: Caveats to Deployable Model Performance in Common Clinical Machine Learning Tasks.” Proceedings of Machine Learning for Healthcare 2019 (MLHC ’19), 2019, [https://www.mlforhc.org/s/Nestor.pdf](https://www.mlforhc.org/s/Nestor.pdf).
* Finlayson, Samuel G., et al. "Adversarial attacks on medical machine learning." Science 363.6433 (2019): 1287-1289.

Investigations into model performance on minority subpopulations, and the implications thereof.

* Boag, Willie, et al. "Racial Disparities and Mistrust in End-of-Life Care." Machine Learning for Healthcare Conference. 2018. [https://www.mlforhc.org/s/2.pdf](https://www.mlforhc.org/s/2.pdf)
* Chen, Irene Y., Peter Szolovits, and Marzyeh Ghassemi. "Can AI Help Reduce Disparities in General Medical and Mental Health Care?." AMA journal of ethics 21.2 (2019): 167-179. [https://journalofethics.ama-assn.org/article/can-ai-help-reduce-disparities-general-medical-and-mental-health-care/2019-02](https://journalofethics.ama-assn.org/article/can-ai-help-reduce-disparities-general-medical-and-mental-health-care/2019-02)

Scalable, safe machine learning / inference in clinical environments

* Henderson, Jette, et al. "Phenotype instance verification and evaluation tool (PIVET): A scaled phenotype evidence generation framework using web-based medical literature." Journal of medical Internet research 20.5 (2018): e164.

New tools or comprehensive benchmarks for machine learning for healthcare.

* Wang, Shirly, et al. "MIMIC-Extract: A Data Extraction, Preprocessing, and Representation Pipeline for MIMIC-III." Machine Learning for Healthcare, 2019.

Development of Scalable Systems for Processing Data in Practice (demonstrating, e.g., concern for multi-modality, runtime, robustness, etc., as guided by a clinical use case):

* Xu, Yanbo, et al. "Raim: Recurrent attentive and intensive model of multimodal patient monitoring data." Proceedings of the 24th ACM SIGKDD International Conference on Knowledge Discovery & Data Mining. ACM, 2018.

Bridging the deployment gap

* Tonekaboni, Sana, et al. "What Clinicians Want: Contextualizing Explainable Machine Learning for Clinical End Use." Machine Learning for Healthcare (2019)

Remote, Wearable, Telehealth, Public Health

* Wei Q, Wang Z, Hong H, Chi Z, Feng DD, Grunstein R, Gordon C. A Residual based Attention Model for EEG based Sleep Staging. IEEE Journal of Biomedical and Health Informatics. 2020 Mar 3.

Software Packages

* Pollard TJ, Johnson AE, Raffa JD, Mark RG. tableone: An open source Python package for producing summary statistics for research papers. JAMIA Open. 2018 May 23;1(1):26-31.
* Johnson AE, Stone DJ, Celi LA, Pollard TJ. The MIMIC Code Repository: enabling reproducibility in critical care research. Journal of the American Medical Informatics Association. 2017 Sep 27;25(1):32-9.
* Peng Y, Wang X, Lu L, Bagheri M, Summers R, Lu Z. NegBio: a high-performance tool for negation and uncertainty detection in radiology reports. AMIA Summits on Translational Science Proceedings. 2018;2018:188.
