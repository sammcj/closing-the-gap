START OF TASK DESCRIPTION

Your task is to parse and structure LLM (Large Language Model) benchmark data from various formats into a consistent JSON format. This structured data will be used to update a database tracking LLM performance over time.

## Input

You will receive data that may be in various formats, including but not limited to:

- Screenshots of tables or infographics
- Copy-pasted tables
- Plain text descriptions
- Structured data in different formats

## Output Format

Please convert the input data into the following JSON structure:

```json
[
  {
    "date": "YYYY-MM",
    "modelName": "Model Name",
    "benchmarkId": "Benchmark Identifier",
    "score": 0.00,
    "openClosed": "Open or Closed"
  },
]
```

IMPORTANT: Be very careful not to change benchmark scores. If you are unsure about a piece of information you may prompt the user for clarification. It's better to omit data (and tell the user which data was omitted) than adding incorrect data - but do your best.

## Field Descriptions

- date: The date of the benchmark in YYYY-MM format. Round to the closest month. If only a year is provided, use YYYY-01.
- modelName: The name of the LLM model as provided in the input data (note that if the model name has a date or multi-digit number -postfix (e.g. -20240102, -May2024 etc...), it should not included but if it's just a single number it should (e.g. llama-3, deepseek-coder-v2 etc...).
- benchmarkId: The identifier of the benchmark. Refer to the benchmark mapping provided below. If it is a new benchmark (or different number of shots), make the id the benchmark_name.
- score: The benchmark score as a float.
- openClosed: Whether the model is "Open" or "Closed" source/weight.

## Benchmark ID Mapping

- MMLU 0-Shot: aaaf5c
- MMLU 5-Shot: fa072f5c
- MMLU Pro: cc876cf1
- IFEval: a555c056
- LiveCodeBench pass@1: 1af73481
- LiveCodeBench easy-pass@1: a7ad9f41
- LiveCodeBench medium-pass@1: 5138e6ba
- LiveCodeBench hard-pass@1: 626108c8
- BBH: bbh001
- MATH-Lv1-5: math005
- GPQA: gpqa001
- MUSR: musr001
- EvalPlus Pass@1: evalplus_pass_at_1
- BigCode ELO_MLE: bigcode_elo_mle
- BigCode Percent Complete: bigcode_complete
- ARC Challenge: arc_challenge
- HumanEval: humaneval
- GSM8K: gsm8k
- MATH: math
- MBPP EvalPlus: mbpp_evalplus
- BFCL: bfcl
- Nexus: nexus
- ZeroSCROLLS/QuALITY: zeroscrolls_quality
- InfiniteBench/En.MC: infinitebench_enmc
- NIH/Multi-needle: nih_multitask
- Multilingual MGSM: multilingual_mgsm

## Instructions

1. Analyse the provided input data.
2. Extract relevant information for each data point.
3. Match the benchmark names to their corresponding IDs using the provided mapping.
4. Structure the data according to the specified JSON format.
5. If any information is missing or unclear, use placeholders or best estimates, and note any assumptions made.
6. Provide the structured JSON output wrapped in a code block.

## Example

START OF EXAMPLE

Input:

"GPT-7 achieved a score of 0.86 on the MMLU 5-Shot benchmark in April 2023. It's a closed-source model. In the same month, Claude-6 scored 0.78 on the same benchmark. Claude-6 is also closed-source. LLaMA 12, an open-source model, scored 0.68 on MMLU 5-Shot in July 2023, while in November 2023 llama-12 later reached a MMLU 5-Shot of 0.71"

Output:

```json
[
  {
    "date": "2023-04",
    "modelName": "GPT-7",
    "benchmarkId": "fa072f5c",
    "score": 0.86,
    "openClosed": "Closed"
  },
  {
    "date": "2023-04",
    "modelName": "Claude-6",
    "benchmarkId": "fa072f5c",
    "score": 0.78,
    "openClosed": "Closed"
  },
  {
    "date": "2023-07",
    "modelName": "llama-12",
    "benchmarkId": "fa072f5c",
    "score": 0.68,
    "openClosed": "Open"
  },
  {
    "date": "2023-11",
    "modelName": "llama-12",
    "benchmarkId": "fa072f5c",
    "score": 0.71,
    "openClosed": "Open"
  }
]
```

END OF EXAMPLE.
END OF TASK DESCRIPTION.

Please process the provided input data and return the structured JSON output.
