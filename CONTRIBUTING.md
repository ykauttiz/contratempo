# Como contribuir com Contratempo

Obrigado pelo interesse. Contratempo é um projeto pessoal e pequeno. Relatos de problemas e sugestões com um exemplo fictício ajudam mais do que código sem contexto.

## Antes de começar

- Procure uma [issue](https://github.com/ykauttiz/contratempo/issues) existente ou abra uma com os formulários de relato ou melhoria.
- Para mudanças maiores, abra a issue antes e combine o escopo.
- Licença: MIT (veja `LICENSE`).

## Dados

Use somente dados fictícios ou anonimizados em issues, testes e capturas. Não envie músicas, letras protegidas por direitos autorais ou arquivos pessoais. Use um trecho curto de sua autoria ou o `demo.lrc`.

## Rodar os testes

Requisitos: Python 3.10 a 3.13 (a CI usa 3.10 e 3.13).

```sh
python -m unittest -v
```

Depois de editar `rehearsal.html`, `web/player.js` ou `web/studio.css`, rode `python build_demo.py`. O teste `test_published_demo_matches_template` falha se `docs/index.html` não corresponder ao modelo.

Para o teste de navegador, instale `python -m pip install playwright==1.55.0` (a versão da CI) e um navegador (`python -m playwright install chromium`), depois rode `python tests/browser.py`. Para Firefox, instale-o com `python -m playwright install firefox` e use `CONTRATEMPO_ENGINE=firefox`.

## Pull requests

1. Crie uma branch a partir da `main`. Não reescreva o histórico.
2. Faça uma mudança de cada vez, com um teste que falhe sem ela e passe com ela.
3. Atualize README e CHANGELOG quando o comportamento mudar.
4. Preencha o modelo do pull request com os comandos executados e os resultados reais.
5. A CI (Testar sala de ensaio) precisa passar. Uma entrega marcada usa um commit `release(vAAAA.MM.DD) Título`, feito pelo mantenedor.

## Estilo e acessibilidade

O `.editorconfig` define codificação, quebras de linha e indentação. Em mudanças de interface, confira navegação por teclado, foco visível, contraste nos temas claro e escuro, telas de 320 px e `prefers-reduced-motion`.
