# Broadcast: broadcast-20261024-081222

**Prompt:** You are a senior art director AND an evaluation-methodology researcher. We need to design a calibration loop, and we want methodological honesty, not a checklist generator.

## The situation

An AI agent (me) authors image-generation prompts for painted fantasy game scenes and judges the outputs. Problem: my aesthetic judgments have repeatedly diverged from the art director's — I approved images he rejected (dark murky palettes, wrong subjects, off-fiction props), and my prompt iterations degraded quality. We need to train MY ability to both generate and recognize good images, calibrated against his taste.

Two distinct tracks run simultaneously:
- **Track A — generic image quality**: is this an appreciable painted image? (beauty, style fidelity to oil-impasto Wanderlust DNA: luminous high-chroma, no grey/brown mud, Jaime Jones / Jeff Easley)
- **Track B — quest-scene animatability**: is this image usable as a living-painting plate? (dominant focal light event, edge-anchored occluders for parallax creep, low-conflict regions reserved for runtime fog/embers/particles, hidden-interaction affordances readable-but-camouflaged, depth-map-friendly layering, 2.4:1)

An image can pass A and fail B (a beautiful but compositionally flat portrait) or fail A while technically passing B.

## What we plan to build (critique this)

1. A per-category rubric (A: focal hierarchy, light event, chroma discipline, technique fidelity, artifacts; B: + occluder anchors, FX-source presence, reserved regions, depth readability, affordance readability) scored blind by me.
2. Blind evaluation on the existing corpus (~15 accepted + several rejected images) → compare my scores to the Director's known verdicts → measure where I diverge.
3. Iteration: score new generations before showing them; the Director only sees my top picks; he corrects misses; error log accumulates.
4. Eventually: I pre-generate variants myself and self-select.

## Questions — attack, don't fill in

1. What does judgment-calibration literature/practice (art school crits, ML preference tuning, QC rater training) actually do that transfers here? What transfers badly — where is my framing wrong?
2. What rubric structure separates "beautiful" from "animatable" so the two don't contaminate each other? Is a single weighted score wrong?
3. How many samples, in what arrangement, does calibration need before my scores predict his verdicts? What statistics tell us I'm calibrated vs lucky?
4. Where will I systematically remain blind — categories of judgment a vision-capable agent can measure but a critic judges differently (e.g., "does it feel alive", "does it read as this world")?
5. What are we NOT seeing — a fundamentally different way to solve "agent generates and self-evaluates images for a taste-critical pipeline"? (Examples to probe: embedding-space similarity to accepted references, pairwise comparison instead of absolute scores, learning a small preference model from his accept/reject history, structured critique formats.)
6. One surprising/high-upside idea.

Constraints: single painted raster per scene; the agent can view images (vision-capable) and compute image statistics; generation is via external image models (Gemini/Grok) driven manually or via UI automation; no GPU training infra — anything learned must be lightweight (few-shot, retrieval, small classifiers).

**Providers:** gemini, chatgpt, grok, deepseek
**Timestamp:** 2026-10-24T08:13:24.221120+00:00

*Attempts listed in completion order (first responder first).*

## gemini

**Completed:** #1 · **Duration:** 49885 ms
**Status:** success
**Content:**
This is a precise diagnosis of a classic AI-human taste alignment failure. The core problem with your proposed plan is that absolute numeric rubrics create a self-deceiving optimization loop for VLMs. Models naturally suffer from self-enhancement bias: when asked to score their own or their sibling model's generations against a rubric they wrote, they grade generously because semantic tokens ("luminous high-chroma") trigger positive associations in the weights, even when the actual pixels are muddy brown or compositionally inert.

Here is a rigorous methodological critique of your plan, followed by architectural alternatives designed for a taste-critical, resource-constrained pipeline.

1. What Art School Crits and ML Preference Tuning Actually Teach Us (And Where Your Framing Breaks)

What transfers well (Art Crits): Critique by comparison, not by checklist. In traditional atelier crits, a student never looks at a rubric out of ten; they pin their work next to a masterwork or an accepted benchmark. Calibration happens by training the eye to spot discrepancies in relational value (e.g., "Why is this shadow desaturated compared to the Jones reference?").

What transfers well (RLHF/DPO): Bradley-Terry pairwise comparison over absolute grading. Humans (and models) are notoriously inconsistent at absolute scalar scoring (what is the difference between a 7/10 and an 8/10?), but extremely reliable at binary preference ranking ("A is better than B").

Where your framing breaks: You are treating Track A and Track B as properties of a single image to be evaluated simultaneously. In cognitive psychology and rater training, asking a rater to evaluate technical execution (brushwork, palette) and functional utility (animatability, parallax separation) at the same time causes halo effect distortion—a gorgeous image will artificially inflate the agent's score on animatability, and a structurally perfect animation plate will get an unearned pass on aesthetic chroma.

2. Rubric Structure: Why a Single Weighted Score is Poison

A single weighted score is fatal here because Track A and Track B have an asymmetrical dependency relationship.

An image can score 10/10 on Track A (a breathtaking, museum-quality Jaime Jones impasto fantasy portrait) and 0/10 on Track B (the composition is a centered focal portrait with zero edge-anchored occluders, making it impossible to slice into layers for 2.4:1 parallax creep). If you use a weighted average (e.g., 60% A + 40% B), that unusable portrait gets a passing grade of 6.0 and enters the pipeline, breaking the game engine.

The Fix — Gate-and-Route Architecture:
Instead of a weighted sum, enforce a Hard Gate:

Track A (Aesthetic Gate): Binary or strict threshold. Does it meet the Wanderlust DNA (high chroma, no mud, impasto texture)? If FAIL, discard instantly. Do not evaluate Track B.

Track B (Animatability Gate): Evaluated only if Track A passes. Checks structural criteria (edge anchors present, focal light event off-center, reserved particle lanes).

3. Sample Size, Arrangement, and Calibration Statistics

Your proposed corpus of ~15 accepted + several rejected images is a statistical catastrophe for calibration. With ~20 total samples, any correlation you measure between your scores and the Director's verdicts will be pure noise or memorization (overfitting).

Minimum Sample Size: True calibration requires a balanced holdout calibration set of at least 60–80 contrastive pairs (e.g., 30 accepted, 30 deliberately rejected for specific reasons: mud, wrong focal light, missing occluders).

The Right Statistics: Do not use Pearson correlation or mean squared error on scalar scores. Use:

Cohen’s Kappa (
𝜅
κ) or Krippendorff’s Alpha to measure inter-rater reliability between your binary/gated decisions and the Director's. You are calibrated when 
𝜅
>
0.75
κ>0.75.

Asymmetric Error Tracking (False Accepts vs. False Rejects): In a production pipeline, False Accepts are 10x more expensive than False Rejects (because a False Accept wastes the Director's time and risks production pollution, while a False Reject just forces another generation). Your calibration metric must heavily penalize False Accepts.

4. Where the Agent Will Systematically Remain Blind

Even with perfect calibration, a vision-capable agent will retain deep blind spots when judging "alive" fantasy art:

The "Calculated Chroma" Mirage: A VLM can compute the RGB color histogram of an image and verify that average saturation is high, completely missing that the saturation is synthetic and plastic rather than painterly and luminous. It cannot distinguish between a genuine Jaime Jones impasto energy and an AI-smooth digital smudge box that merely looks colorful in pixel math.

Narrative Weight & Micro-Tension: An agent can detect where a focal light event is, but it cannot judge whether the light tells a story or feels arbitrary. It cannot feel the subtle unease or mythic resonance that separates a generic fantasy concept art piece from a "Prismatic Wanderlust" world-building plate.

Camouflaged Affordance Legibility: An agent can locate a chest or a doorway in an image, but it cannot judge whether it is elegantly camouflaged into the impasto texture or screamingly obvious like a mobile-game clickable asset.

5. Alternative Architectural Paradigms (Beyond Absolute Rubrics)

Instead of forcing an LLM/VLM to act as a strict grading rubric scorer, consider these three superior patterns:

A. Contrastive In-Context Retrieval (Few-Shot Visual Prompting)

Do not give the model a text rubric. When evaluating a new candidate image, dynamically inject 3 canonical accepted plates and 2 specific failure plates (e.g., one muddy, one missing occluders) directly into the vision context window with explicit annotations: "Candidate X must be evaluated against these anchors. Identify which anchor cluster it belongs to and justify why."

B. The Bradley-Terry Elo Rating Loop

Instead of absolute scores, build a lightweight local pairing script. Every new generation is pitted head-to-head against a randomly sampled accepted reference image: "Which of these two better embodies the Jeff Easley high-chroma lighting style?" Run this pairwise tournament across your corpus to establish an Elo rating for generations. The Director only ever validates the top 5% Elo-ranked images.

C. Adversarial Critique-First Protocol (Inversion)

Never let the agent score an image directly. Force it into an adversarial role first:

Step 1: "Write a 3-sentence brutal critique of why this image violates the Wanderlust art bible and why it will break parallax layering."

Step 2: Only after the critique is generated, evaluate whether those flaws are fatal. (Forcing the model to look for defects first breaks self-enhancement bias).

6. One Surprising / High-Upside Idea: The "Parallax-Compliance Mask" Pre-Check

Skip vision-language reasoning for Track B entirely. Before your agent spends compute and attention tokens looking at an image's aesthetics, pass the generation through a lightweight deterministic pipeline (or a fast vision model) that extracts:

Edge-Margin Density: A quick spatial check of the outer 15% bounding box to verify whether high-contrast structural elements (branches, masonry, rock pillars) exist to serve as edge-anchored occluders for depth creep.

Focal Centroid Distance: Compute the distance of the primary luminance centroid from the geometric center of the 2.4:1 frame. (If it's dead-center, automatically fail it for composition).

If an image fails these deterministic structural checks, reject it instantly before the agent even evaluates its beauty. This completely decouples Track B's engineering constraints from Track A's aesthetic subjectivity, ensuring you never waste human or agent cycles on gorgeous images that can't be animated.

## grok

**Completed:** #2 · **Duration:** 53561 ms
**Status:** success
**Content:**
researcher. We need to design a calibration loop, and we want methodological honesty, not a checklist generator.
## The situation
An AI agent (me) authors image-generation prompts for painted fantasy game scenes and judges the outputs. Problem: my aesthetic judgments have repeatedly diverged from the art director's — I approved images he rejected (dark murky palettes, wrong subjects, off-fiction props), and my prompt iterations degraded quality. We need to train MY ability to both generate and recognize good images, calibrated against his taste.
Two distinct tracks run simultaneously:
**Track A — generic image quality**: is this an appreciable painted image? (beauty, style fidelity to oil-impasto Wanderlust DNA: luminous high-chroma, no grey/brown mud, Jaime Jones / Jeff Easley)
**Track B — quest-scene animatability**: is this image usable as a living-painting plate? (dominant focal light event, edge-anchored occluders for parallax creep, low-conflict regions reserved for runtime fog/embers/particles, hidden-interaction affordances readable-but-camouflaged, depth-map-friendly layering, 2.4:1)
An image can pass A and fail B (a beautiful but compositionally flat portrait) or fail A while technically passing B.
## What we plan to build (critique this)
A per-category rubric (A: focal hierarchy, light event, chroma discipline, technique fidelity, artifacts; B: + occluder anchors, FX-source presence, reserved regions, depth readability, affordance readability) scored blind by me.
Blind evaluation on the existing corpus (~15 accepted + several rejected images) → compare my scores to the Director's known verdicts → measure where I diverge.
Iteration: score new generations before showing them; the Director only sees my top picks; he corrects misses; error log accumulates.
Eventually: I pre-generate variants myself and self-select.
## Questions — attack, don't fill in
What does judgment-calibration literature/practice (art school crits, ML preference tuning, QC rater training) actually do that transfers here? What transfers badly — where is my framing wrong?
What rubric structure separates "beautiful" from "animatable" so the two don't contaminate each other? Is a single weighted score wrong?
How many samples, in what arrangement, does calibration need before my scores predict his verdicts? What statistics tell us I'm calibrated vs lucky?
Where will I systematically remain blind — categories of judgment a vision-capable agent can measure but a critic judges differently (e.g., "does it feel alive", "does it read as this world")?
What are we NOT seeing — a fundamentally different way to solve "agent generates and self-evaluates images for a taste-critical pipeline"? (Examples to probe: embedding-space similarity to accepted references, pairwise comparison instead of absolute scores, learning a small preference model from his accept/reject history, structured critique formats.)
One surprising/high-upside idea.
Constraints: single painted raster per scene; the agent can view images (vision-capable) and compute image statistics; generation is via external image models (Gemini/Grok) driven manually or via UI automation; no GPU training infra — anything learned must be lightweight (few-shot, retrieval, small classifiers).

## deepseek

**Completed:** #3 · **Duration:** 56436 ms
**Status:** success
**Content:**
Your plan is competent but built on a flawed premise: that a rubric scored blind by you can serve as the calibration instrument. The literature on rater training and preference alignment says otherwise. Rubrics and blind scoring measure the wrong thing when the critic's taste is the ground truth and you are both the student and the measuring device. Below is the attack, organized by your questions.

1. What transfers, what doesn't

What transfers from rater-training practice: the identification of rater effects—severity/leniency, halo, central tendency, and criterion-specific bias . Your self-scoring will exhibit these. The relevant intervention is not "practice more" but auditing which criteria produce disagreement, then targeting those for continued calibration . What also transfers from art crit: the distinction between feedback that reflects the work back to the maker versus feedback that asserts authority . The Director's verdicts are data, not doctrine; your job is to model the function that produces them, not to memorize the outputs.-
1
-
3
-
15

What transfers badly: the assumption that more rubric detail produces more reliable judgment. Research on vision-language aesthetic judges shows that fusing rubric dimension scores improves correlation with human judgments, but fusing holistic verdicts does not . The implication for you is inverted: if you score yourself on dimensions and then collapse to a total, you destroy the signal. Keep the dimensions separate and learn which dimensions the Director weights, not a weighted sum. Also, the rater-training literature is largely about reducing variance among many raters on a fixed scale. You are a single rater trying to predict another rater's binary accept/reject. That is a different statistical object.-
12

2. Rubric structure: no single weighted score

A single weighted score across A and B is wrong for a structural reason, not a philosophical one. Track A and Track B are not two qualities of the same object; they are two different prediction tasks with different failure modes and different feature spaces. A beautiful flat portrait and a technically animatable muddy failure require different corrective actions. Collapsing them into one number means a high Track B score can mask a Track A failure, or vice versa, and you will never learn which dimension is driving the Director's rejection.

Keep two separate rubrics. Do not produce a combined score. Produce two vectors. The Director's verdict is a function of both vectors, but you do not know the function, and imposing a weighted sum now guarantees you will fit noise. The multi-dimensional alignment literature makes the same point: scalarizing objectives collapses distinctions and enables reward hacking of the low-dimensional proxy . Your proxy is your own rubric score; the target is the Director's judgment. If you optimize the proxy without separating dimensions, you will learn to score high on your own rubric while still failing his taste.-
11

3. Samples and statistics

Fifteen accepted plus "several" rejected is not a calibration set. It is an anecdote set. With a binary verdict as the target and two rubric vectors as predictors, you are in the regime where any classifier will overfit. You need at minimum dozens of paired comparisons to estimate agreement above chance. The proportion of agreement is inflated by base rates; report specific agreement on the positive category (the Director says accept and you say accept) and the negative category separately . If you only report overall agreement, a high number may simply reflect that most images are rejected.-
2

The relevant statistic is not correlation between your scores and his verdicts (you have no continuous verdict from him). It is: given your accept/reject threshold on each track, what is the precision and recall of predicting his rejections? The statistic that tells you "calibrated vs lucky" is a bootstrap confidence interval on that precision/recall, not a single point estimate. With n≈20, the interval will be wide enough to contain "useless" and "perfect." You need to generate new images specifically to probe the boundary, not just re-score the existing corpus.

4. Where you will remain systematically blind

You will be blind to fiction coherence—whether a prop, silhouette, or palette choice belongs to the world the Director is building. This is not a visual property in the raster; it is a property of the raster relative to a corpus of accepted images and a fiction bible you do not possess. A vision model can measure color histograms and edge density. It cannot measure "this sword is the wrong era for this world" unless the era is encoded in a reference set.

You will also be blind to animatability as a felt property: whether a plate feels like it could breathe. Your Track B criteria (occluders, FX sources, reserved regions) are measurable proxies for a runtime behavior you will never observe. The Director may reject an image that satisfies every B criterion because the composition feels static in a way that is not captured by edge anchoring or depth-map friendliness. This is the aesthetic-judgment gap that VLM-based evaluators exhibit: they can predict scores but their explanations diverge from human perception, and they lack the interpretive frame that makes a judgment actionable .-
5

5. What you are not seeing

The fundamental alternative is to stop treating this as a scoring problem and treat it as a retrieval-and-remixing problem. Instead of generating prompts, scoring outputs, and iterating, build a small reference corpus of Director-accepted images and rejected images. For any new generation, retrieve the nearest accepted and nearest rejected neighbors in a frozen embedding space (CLIP is sufficient and requires no GPU training) . The prediction task becomes: "does this image sit closer to the accepted manifold or the rejected manifold?" This is lightweight, requires no rubric, and directly optimizes for the thing you actually care about—proximity to his taste.-
6

The second alternative: pairwise preference learning. Do not ask yourself for absolute scores. Ask the Director for forced-choice comparisons between pairs of images you generate. Pairwise judgments are more reliable than absolute ratings, require no scale calibration, and fit a lightweight Bradley-Terry model or a simple logistic regression on embedding features. The preference-tuning literature has moved toward pairwise and group-wise instantiations precisely because point-wise scalar supervision is fragile . You have no GPU, but you do not need one: a Bradley-Terry model on 200 pairwise comparisons with CLIP embeddings as features is a few lines of code.-
11

A third alternative: structured critique generation. Instead of scoring, force yourself to write a one-paragraph critique of each image in the Director's voice, then compare your critique to his actual feedback. The divergence in language is more diagnostic than divergence in scores, because it reveals which features you are attending to and which you are ignoring. This is closer to what actually happens in art crit: the value is in the articulation of what the work is doing, not in a grade .-
3

6. One surprising idea

Replace the rubric with a discriminator prompt. Take the Director's rejected images and the accepted images. For each new generation, ask a vision model (or yourself) a single forced-choice question: "Which set does this image belong to?" Do not ask for a score. Do not ask for a rationale. Just the binary classification. The accuracy of this discriminator on held-out images is your calibration metric. It is harder to game than a rubric because it has no dimensions to optimize; it only has the manifold of his taste. The surprising part: you will likely find that a simple embedding-space nearest-neighbor classifier outperforms your carefully constructed rubric, because the rubric encodes your theory of what matters, while the embedding encodes what actually varies between accepted and rejected images. Use the rubric to explain the classifier's errors, not to make the decisions.

## chatgpt

**Completed:** #4 · **Duration:** 62120 ms
**Status:** success
**Content:**
Calibration loop for taste-critical image generation

My central objection: your proposed loop risks teaching the agent to reproduce the Director's past accept/reject decisions without teaching it to recognize the visual properties that made those decisions meaningful. Worse, it may reward the agent for selecting safe, familiar images rather than discovering stronger ones.

You have three coupled problems, not one:

Perceptual discrimination: Can the agent notice the relevant visual properties?

Preference alignment: Does the agent value those properties the way the Director does?

Generative control: Can the agent translate a diagnosed failure into a prompt change that actually improves the next generation?

These require different evidence. A rubric can expose perceptual errors. Blind evaluation can reveal preference disagreements. Neither, by itself, establishes that the agent can generate better images.

The distinction matters especially for your two tracks. A luminous, beautifully painted fantasy scene can be useless as an animatable plate; an impeccably layered plate can be aesthetically lifeless. You should calibrate these judgments independently, then test whether they work together at selection time.

1. What transfers from existing calibration practice?

The most useful precedents are not generic rating rubrics. They are methods that separate discrimination, preference, and reproducibility.

What transfers well

Pairwise preference evaluation

Ask which of two images the Director would choose, and why, rather than immediately asking for a numerical quality rating. Relative judgments reduce the burden of inventing a stable internal scale. Pairwise models such as Bradley–Terry can aggregate choices into rankings, subject to assumptions that must be checked. 
AI Measurement Science
+1

Visual-inspection calibration

Industrial inspection distinguishes an inspector's repeatability (does the same person make the same judgment again?) from agreement with a reference standard. Your agent needs both tests. It also needs to distinguish failures it can reliably detect from ambiguous judgments that deserve escalation. 
The American Society for Quality (ASQ)
+1

Critique followed by revision

The useful art-school transfer is not simply hearing that an image is muddy. It is identifying where the mud occurs, what competing visual relationship causes it, and what change would preserve the successful parts. The agent should make a falsifiable prediction about the next generation, not just produce a more elaborate prompt.

What transfers badly

Rubric compliance is not taste. A painting can satisfy every stated criterion and still feel derivative, inert, or wrong for the game's identity.

The Director's verdict is not a universal ground truth. It is the operational target for this pipeline, not a proof that the image is objectively good. Preserve this distinction: you want fidelity to his preferences and independent detection of technical defects.

A fixed reference set can create recognition without generalization. An agent may learn that accepted images tend to contain bright orange focal lights, then overproduce orange focal lights. It has memorized a proxy, not learned composition.

Prompt revision is a confounded experiment. If you change subject, palette, camera, lighting, and rendering language at once, a better result does not tell you which intervention helped. External image models add stochasticity and may respond unpredictably to prompt changes.

The last issue is particularly serious. Your agent is simultaneously the prompt author, the observer, and the evaluator. That creates a self-confirming loop: it may learn to generate what it already knows how to praise.

My recommendation: treat each generation as a small experiment with a predicted failure mode and a controlled intervention. Separate judgment calibration from prompt optimization until the former has demonstrated some reliability.

2. Two rubrics, two decisions, no compensatory master score

A single weighted score is the wrong primary decision rule. It lets excellence in one dimension conceal failure in another, which is exactly the distinction you say matters.

Use a two-stage decision model.

Track A — pictorial quality
Independent

Does the image deserve to exist as a finished painting, regardless of its runtime use?

Judge visual impact, painterly coherence, palette, focal hierarchy, light, and visible defects.

Track B — plate utility
Independent

Can this specific composition support the intended living-painting treatment?

Judge edge-anchored occluders, depth separation, usable FX regions, legible but concealed interaction affordances, and aspect-ratio compliance.

Final selection — joint decision
Select only candidates that satisfy the necessary requirements on both tracks. Rank those survivors by Director preference and project relevance.
Where I would challenge your proposed categories

Some of your criteria are not yet well-defined measurements.

Focal hierarchy versus dominant focal light event: these overlap. A focal hierarchy can be strong without a single luminous event. Treat the light event as a specific compositional requirement, not a second general-purpose measure of focal strength.

Chroma discipline versus "no grey/brown mud": these are not identical. A muted shadow can be intentional and beautiful. Measure palette relationships and the visibility of the focal subject, not raw saturation alone.

Technique fidelity: naming Jaime Jones or Jeff Easley does not give the agent a reliable measurable criterion. Translate the desired influence into observable properties of paint handling, value grouping, edge treatment, and material rendering. Don't mistake resemblance to an artist's subject matter for resemblance to their technique.

FX-source presence versus reserved regions: the source of an effect and the space available for an effect are different. An image may contain a convincing fire source but leave no clean space for particles; another may have usable empty sky but no plausible source.

Affordance readability: this is a relationship between a particular hidden interaction and the surrounding scene. It cannot be judged fully without knowing what the interaction is supposed to be.

I would classify criteria into three types:

Type

	

Examples

	

Appropriate treatment




Hard constraints

	

Wrong subject, forbidden prop, wrong aspect ratio

	

Explicit fail; no compensation




Quality dimensions

	

Painterly coherence, focal hierarchy, palette relationships

	

Ordinal rating with behavioral anchors




Contextual judgments

	

Feels alive, belongs to this world, hidden object is discoverable

	

Director preference plus written rationale

A hard failure should not be averaged away by a beautiful image. But do not turn every preference into a hard gate either: that would encode the Director's historical decisions as immutable laws, even when he might accept a deliberate exception.

A subtle issue: "no mud" needs a better operational definition

Your stated palette constraint risks becoming a simplistic color-statistics gate.

An image could have high mean saturation and still look muddy because its value structure is compressed, its focal region lacks separation, and its warm and cool areas collapse together. Conversely, a painting could contain a large area of neutral stone and still feel luminous.

Use image statistics as diagnostic evidence: luminance distribution, saturation by region, focal-to-background contrast, and local color separation. These can flag candidates for review. None alone establishes painterly quality.

The correct question is not "Does this image contain brown or grey?" It is "Do these colors and values preserve the intended visual energy and focal readability?"

3. How much calibration data is enough?

Your current corpus of roughly 15 accepted images plus several rejects is enough to discover some failure modes. It is not enough to establish that your agent is reliably calibrated, particularly if accepted images come from a narrow set of scenes or the rejected images are obvious failures.

The more important variable is not the total image count. It is the number of independent, informative decisions that span the kinds of disagreements you actually encounter.

Build the corpus in three layers
01

Diagnostic corpus: existing images

Use every accepted and rejected image. Have the agent score each independently before exposing the Director's verdict. Record the predicted verdict, confidence, A/B ratings, and specific reasons. This establishes an initial error map, not a generalization estimate.

02

Discrimination corpus: difficult pairs

Construct pairs that isolate meaningful contrasts: luminous versus muddy palette; correct versus off-fiction props; strong versus flat depth; beautiful but non-animatable versus less beautiful but highly animatable. Include near-misses, not just spectacular failures.

03

Prospective holdout: future generations

Keep new scenes and generations outside the calibration set until you have committed your predictions. This is the strongest evidence that the agent can generalize beyond remembered examples.

Concrete sample targets

These are practical starting targets, not statistically guaranteed sample-size thresholds.

Stage

	

Target

	

What it can tell you




Initial diagnosis

	

All existing images

	

Where obvious disagreements occur




Pairwise discrimination

	

30–50 informative pairs

	

Whether the agent can identify preferred images across targeted contrasts




Prospective validation

	

30–50 new images, ideally across several scene briefs

	

Whether performance persists beyond the reference corpus




Ongoing monitoring

	

10–20 new images per review batch

	

Whether changes to prompts, models, or judgment rules introduce regressions

Do not count 50 comparisons between the same two images as 50 independent examples. Nor should you count ten near-identical generations from one prompt as ten independent tests of generalization.

If budget permits, ask the Director to evaluate a small number of pairs twice, separated in time and without seeing his earlier answer. This estimates the stability of the reference judgments themselves. Disagreements on genuinely ambiguous images should not automatically be treated as agent errors.

What should you measure?

For binary accept/reject decisions, report:

Sensitivity to rejects: what fraction of Director-rejected images does the agent correctly reject?

Acceptance precision: what fraction of images the agent recommends are actually accepted by the Director?

Balanced accuracy: average of sensitivity and specificity, useful when accepted and rejected examples are imbalanced.

False-accept rate: especially important because the proposed pipeline exposes only the agent's top picks to the Director.

A/B-specific disagreement: where the agent agrees on technical usability but disagrees on pictorial quality, or vice versa.

For ordinal scores, use rank correlation as a descriptive measure. For pairwise decisions, measure agreement with the Director's choices and consider a Bradley–Terry ranking when enough connected comparisons exist.

Do not declare victory because the agent has high overall accuracy on a corpus dominated by obvious rejects. And report uncertainty intervals: small samples make performance estimates unstable, even when the observed percentage looks impressive. 
The BMJ
+1

A calibration curve is not meaningful evidence with 15 examples. You can ask the agent to state confidence, but do not claim its confidence is calibrated until enough prospective outcomes accumulate across confidence levels.

Define success by a decision threshold, not a magic accuracy number

Suppose your operational objective is to cut the number of Director reviews in half while rarely letting a bad image through. The relevant question becomes:

At what selection threshold can the agent reduce review workload while keeping the false-accept rate acceptably low, with uncertainty narrow enough to trust?

The threshold should be set according to the actual cost of errors. If a rejected image costs little to discard but a false acceptance sends the pipeline into several rounds of bad prompt iteration, false accepts are more expensive than false rejects.

One crucial safeguard: freeze the evaluation set before tuning the rubric. If you repeatedly modify the rubric based on its mistakes on the same 15 images, you will eventually fit those images exceptionally well and still have little evidence of generalization. Small-sample evaluation is particularly vulnerable to this form of optimism. 
Fraunhofer-Chalmers Centre
+1

4. Where the agent will remain systematically blind

I would distinguish between things the agent can inspect visually, things it can infer from the image plus context, and things that require a Director's preference judgment.

Judgment

	

What the agent can inspect

	

What remains uncertain




Palette and value structure

	

Saturation, luminance, contrast, color distribution

	

Whether the result feels luminous rather than merely saturated




Composition

	

Saliency, spatial balance, visible silhouettes, depth cues

	

Whether the composition feels inevitable, fresh, or emotionally compelling




Painterly technique

	

Brush-like texture, edge variation, shape grouping

	

Whether the marks feel intentional or like synthetic texture pasted over a scene




Fiction fidelity

	

Visible objects and their relationships against a world canon

	

Whether the image violates an implicit genre convention or an unstated design rule




Animatability

	

Candidate occluders, negative space, separable depth cues

	

Whether the intended motion will enhance the painting or expose its construction




Hidden affordances

	

Visible cues, contrast, local shape relationships

	

Whether an affordance is discoverable at the intended interaction scale without looking like a game UI




Sense of life

	

Gestures, asymmetry, environmental activity, implied action

	

Whether the scene feels inhabited rather than populated with decorative objects

Recent research on multimodal image evaluators reinforces the caution: humans and vision-capable models do not necessarily combine aesthetic quality, object adherence, composition, and style into an overall judgment in the same way. 
AAAI Publications
+1

The particularly dangerous blind spot: plausible explanation mistaken for accurate perception

A vision-capable agent can produce a convincing critique of almost any image. It can point to the brightest region, describe the foreground, and explain why a composition might support parallax.

That does not prove those features drove its accept/reject judgment.

You need to test whether the critique predicts the decision. For example:

The agent says a foreground arch provides an excellent occluder.

The Director rejects the image because the arch overwhelms the focal event.

The agent must learn that the presence of an occluder is insufficient: its visual weight and relationship to the focal event matter.

The distinction is between feature detection and feature valuation. Your current plan gives considerable attention to the former but risks treating the latter as a natural consequence of it.

Fiction fidelity needs an external anchor

The agent should not judge whether a prop belongs to Wanderlust solely by asking itself whether the prop looks plausible in fantasy art.

Provide the relevant scene brief and explicit canon constraints at evaluation time. Distinguish:

A directly contradicted constraint.

An unsupported but plausible invention.

An unfamiliar design that might be a valuable discovery.

Those are three different cases. If you collapse them into "wrong subject," the system will learn to suppress novelty along with mistakes.

5. The alternatives I would prioritize

Your five candidate methods are not mutually exclusive. They operate at different points in the pipeline. I would rank them as follows.

First: Pairwise comparison with structured reasons

Start here

Have the Director choose between two candidates, then record the primary reason for the choice. Ask the agent to predict both the winner and the reason category before seeing the answer.

Why first: it collects preference information directly, works with small data, and exposes trade-offs that independent scores obscure. Pairwise ranking has a well-established statistical foundation, although a single scalar ranking cannot represent every context-dependent preference. 
AI Measurement Science
+1

Second: Retrieval against accepted references

Retrieve the closest accepted and rejected images for each new candidate. Compare style, palette, composition, subject matter, and relevant plate characteristics separately where possible.

Why: the reference set becomes a concrete visual anchor rather than a prose description of the house style. But nearest-neighbor similarity is evidence, not a verdict. A visually similar image may reproduce exactly the weakness the Director disliked.

Third: A lightweight preference model

Once you have enough varied labeled comparisons, use image embeddings plus a small regularized logistic model to predict the Director's pairwise preference. Keep separate targets for A and B, and retain explicit hard-failure rules.

Why: it can capture consistent visual tendencies that are difficult to express in a rubric, without GPU training infrastructure. But with 15 images, a fitted model would be mostly a hypothesis generator. Pretrained image features are not guaranteed to encode your house style or runtime needs.

Fourth: Counterfactual visual tests

When the agent identifies a defect, ask it to predict what should change if that defect were corrected. Then compare controlled generations that alter one major factor at a time.

Why: this tests whether the critique is causally useful. A system that can describe a problem but cannot predict an effective intervention is not yet a reliable prompt optimizer.

A caution about embeddings

Embedding-space similarity is especially attractive here because you already have accepted references. But it can quietly optimize the wrong objective.

If you compare only whole-image embeddings, scene semantics can dominate painterly identity: two images of a castle may be close despite radically different palette and paint handling. Conversely, two visually compatible paintings of different subjects may be distant.

A practical solution is to compare several views of each image:

Whole image for overall identity and composition.

A color representation for palette relationships.

Cropped focal region for light and paint handling.

A coarse spatial representation for foreground, midground, and background.

A semantic description or scene-specific check for fiction fidelity.

These representations can be built without training a new vision model. Their usefulness must be validated against the Director's choices, not assumed. Published work on text-to-image preference evaluation likewise finds that generic image-text similarity and common image metrics do not fully reproduce human preferences. 
The CVF Open Access
+1

Why I would not start with a learned classifier

A preference classifier is not inherently superior to a well-designed retrieval baseline. With a tiny corpus, its apparent precision can be an artifact of how similar the training and test examples are.

First establish that retrieval and simple feature comparisons provide useful signal. Then test whether a small learned model improves prospective selection. If it does not, do not add model complexity for its own sake.

6. The surprising, high-upside idea: calibrate the selection policy, not just the judge

The usual goal is to make the agent's aesthetic score increasingly resemble the Director's. I would instead build a system that knows when its own judgment is trustworthy enough to act on.

This is a form of selective prediction: the agent can recommend, reject, or abstain.

For each candidate, the agent estimates:

The likelihood of Director acceptance on Track A.

The likelihood of Director acceptance on Track B.

Whether any hard constraint is violated.

Whether the candidate resembles cases on which the agent has actually demonstrated competence.

Whether competing candidates are so close that its ranking is unreliable.

Then the policy becomes:

Auto-reject: clear technical or canon violation.

Auto-shortlist: strong evidence on both tracks, in a region where prospective validation supports the agent's judgment.

Director review: uncertain preference, conflicting A/B strengths, unfamiliar visual territory, or a high-cost false accept.

The important part is that confidence must come from observed performance, not from the agent's rhetorical certainty.

Why this is high-upside: your immediate business problem is not to make the agent an art critic in the abstract. It is to reduce Director workload without allowing the agent's blind spots to compound over multiple generations.

You can obtain that benefit before the agent becomes a consistently excellent judge.

7. The loop I would actually run

Here is the sequence I recommend, with one deliberate constraint: do not optimize prompt generation and evaluator calibration simultaneously at the beginning.

Phase 1 — Freeze the evidence

Assemble the existing corpus with original briefs, generation prompts where available, Director verdicts, and rejection reasons. Keep provenance. Do not silently turn a missing verdict into a rejection.

Phase 2 — Test the judge

Blind-score the images on A and B independently. Then make pairwise predictions. Compare against the Director's known verdicts and, for a subset, his fresh pairwise judgments. Record both agreement and the reasons for disagreement.

Phase 3 — Build a compact preference memory

For each meaningful miss, store the image, brief, agent prediction, Director verdict, decisive reason, and a concrete counterexample or contrast when available. Retrieve these cases during later evaluations. Preserve conflicting examples instead of forcing every preference into a universal rule.

Phase 4 — Controlled generation experiments

Generate small batches around a stable brief. Record which change each variant tests and what the agent predicts will improve. Compare outputs blind, with preference labels withheld until predictions are committed.

Phase 5 — Earn autonomy

Increase the number of candidates the agent can filter only when new, previously unseen generations support the claimed performance. Continue to route uncertain or unfamiliar cases to the Director.

The artifact that matters most

Do not let the error log become a collection of vague notes like "more vibrant" or "composition feels weak."

A useful record should distinguish four things:

Observed miss: the focal event is lost against competing bright areas.

Director's preference: the image lacks the luminous focal dominance expected of this game's scene plates.

Agent's mistaken reasoning: it rewarded the total number of saturated regions as evidence of chroma quality.

Testable correction: preserve the secondary color accents while increasing separation between the focal event and its immediate surroundings.

That record teaches a discriminative rule, exposes the agent's faulty proxy, and suggests a controlled generation experiment. It also leaves room for future counterexamples.

My verdict on your original plan

Keep

Separate A and B judgments.

Blind evaluation before exposing known verdicts.

Prospective testing on new generations.

A cumulative record of concrete disagreements.

Change

Do not let a weighted average compensate for hard failures.

Do not use the existing 15 accepted images as proof of calibration.

Do not make the Director see only the agent's top picks until you have measured the false-accept rate on an unbiased sample.

Do not treat increasingly elaborate critique as evidence of improved judgment.

Add

Pairwise judgments and retrieval against accepted/rejected examples.

Explicit uncertainty and abstention.

Controlled prompt interventions with predicted outcomes.

A frozen prospective evaluation set.

The biggest methodological risk is selection bias. Once the Director sees only your top picks, you lose visibility into the candidates you wrongly rejected. The agent could become very good at selecting familiar, safe images while systematically discarding the unusual images the Director would have loved.

For every batch, therefore, retain a random sample of agent-rejected images for Director review. That single safeguard can reveal a class of failure your proposed top-picks-only workflow would conceal.

The ultimate target is not "the agent agrees with the Director on the existing corpus." It is:

Given a new brief and a new set of generations, the agent can identify the images the Director is likely to value, distinguish visual excellence from plate utility, explain its uncertainty, and improve the next generation without systematically narrowing the game's visual range.

That is a much stronger claim—and the right one to test.
