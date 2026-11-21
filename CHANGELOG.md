# Changelog

## 2026-11-21

A marcação pelo relógio do áudio agora preserva edições de letra e offset ainda não aplicadas.

## 2026-11-20 · Estúdio de ensaio

- Forma de onda interativa para gravações curtas e tamanho de letra ajustável na apresentação.
- Sessão portátil em JSON e retomada local de letra, posição, velocidade e loop.
- Importação local de áudio e LRC por seletor ou arraste.
- Edição com marcação durante a reprodução, ajuste em milissegundos e histórico de 20 edições.
- Repetição A/B, modo apresentação, navegação entre versos pelo teclado e layout para celular.
- Download de LRC, SRT e WebVTT no navegador. O terminal aceita `--last-duration`.
- Parser de milissegundos, testes de formatos e verificação da demo gerada.

## 2026-11-20 · Tom do áudio

Ao mudar a velocidade, escolha se quer manter o tom original da gravação ou acompanhar a mudança de velocidade. O controle aparece em navegadores que oferecem esse recurso.

## 2026-11-20 · Legendas SubRip

Use `python lyrics.py demo.lrc --srt ensaio.srt` para gerar legendas numeradas em UTF-8. A conversão respeita as pausas da letra. Se o arquivo de destino já existir, o comando encerra sem sobrescrevê-lo.

## 2026-11-20 · Contratempo

- Sala de ensaio offline com reprodução de áudio local, seleção de verso e velocidade ajustável.
- Exportação WebVTT e demo de 12 segundos com acompanhamento instrumental original.
- O comando de terminal e a integração opcional com Discord continuam disponíveis.

## 2026-11-20 · Primeiro player executável

- Player Python para arquivos LRC, letra de demonstração e opção de retomada.
- Integração opcional via Rich Presence do Discord Desktop.
- O README anterior descrevia integração com Spotify, WinRT e Docker, mas a branch continha apenas documentação e licença. Esta edição usa reprodução manual sincronizada pelo relógio local.
