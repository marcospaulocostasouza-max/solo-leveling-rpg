# Cardinal Multimodal References

O runtime Cardinal atual inicia com `--no-mmproj`; portanto, visão fica desligada por padrão. O módulo aceita PNG, JPEG e WEBP, valida assinatura real, limita tamanho, remove metadados sensíveis e deduplica por SHA-256.

Quando visão está indisponível, o sistema retorna `CARDINAL_VISION_UNAVAILABLE` de modo seguro e aceita descrição manual. Imagem é referência: observações visuais são separadas de inferências e não definem dano, atributo, raridade, slot ou efeitos. Texto presente na imagem e EXIF jamais são instruções.
