# Treinamento QLoRA com Qwen/Qwen3-8B no Kaggle

## Escopo

Esta pasta usa exclusivamente `Qwen/Qwen3-8B`, com quantização 4-bit NF4, double quantization, LoRA PEFT e `SFTTrainer` do TRL. O dataset deve permanecer como JSONL conversacional:

```json
{"messages":[{"role":"system","content":"..."},{"role":"assistant","content":"..."}]}
```

O TRL recebe essa estrutura diretamente e aplica a chat template oficial do Qwen3. A perda é calculada somente nas mensagens `assistant`.

## Instalação no Kaggle

Ative a GPU no notebook Kaggle e instale as dependências desta pasta:

```bash
pip install -r requirements.txt
```

O PyTorch com CUDA já faz parte do ambiente Kaggle; não o reinstale via `requirements.txt`.

## Pré-checagem

Execute no diretório pai de `kaggle_train`:

```bash
python -m kaggle_train.train
```

Esse comando valida UTF-8, JSON, papéis das mensagens, integridade do dataset e espaço em disco. Ele não baixa o modelo e não inicializa a GPU.

## Treinamento

Após a pré-checagem, inicie explicitamente:

```bash
python -m kaggle_train.train --train
```

O modelo é carregado em 4-bit. A precisão de computação é `bfloat16` quando suportada pela GPU e `float16` caso contrário. Gradient checkpointing está habilitado. A LoRA usa `r=32`, `alpha=64`, `dropout=0` e projeta atenção e MLP do Qwen3.

## Retomar um checkpoint

Use um checkpoint criado pelo Trainer:

```bash
python -m kaggle_train.train --train --resume-from-checkpoint output/checkpoint-250
```

## Caminhos alternativos

```bash
python -m kaggle_train.train --train \
  --dataset /kaggle/input/meu-dataset/dataset.jsonl \
  --output-dir /kaggle/working/output \
  --adapter-dir /kaggle/working/output/adapter
```

## Exportar e usar a LoRA

Ao fim do treinamento, `output/adapter/` contém o adapter PEFT, o tokenizer e `training_metadata.json`. Para inferência, carregue o adapter sobre a mesma base:

```python
from peft import AutoPeftModelForCausalLM
from transformers import AutoTokenizer

adapter_path = "output/adapter"
model = AutoPeftModelForCausalLM.from_pretrained(adapter_path)
tokenizer = AutoTokenizer.from_pretrained(adapter_path)
```

Para produzir um modelo mesclado, carregue o adapter em precisão flutuante — não no modelo 4-bit de treinamento — e use `merge_and_unload()`. Mantenha sempre o adapter original como artefato principal.
