# Changelog

## 21 de novembro de 2026 · Aparência configurável

- Seletor de tema automático, claro e escuro com preferência local e testes de recarga em navegador.

## 2026-11-21

Navegação visual revista, foco de teclado explícito, link para o portfólio e roteiro curto no README.

Os testes de interface também exercitam telas de 320 pixels.

O backup e a biblioteca recuperam o treino de velocidade escolhido. Sessões anteriores abrem com o treino desligado.

Treino progressivo no loop A/B: escolha duas ou quatro voltas para avançar ao próximo nível de velocidade. O contador acompanha o trecho durante a reprodução.

Guarde ensaios com nomes diferentes na biblioteca local. Cada entrada recupera letra, posição e ajustes. Selecione a gravação novamente ao abrir. Use a exportação JSON para manter uma cópia fora do navegador. O CI disponibiliza capturas em duas larguras.

Use **Verso anterior**, **Reiniciar verso** e **Próximo verso** na mesa de reprodução. A busca cobre até 10 mil marcações e a fila exibe 60 por página. Home e End percorrem o conjunto filtrado inteiro. A lista completa de marcas para edição só é montada ao abrir o editor.

Busque palavras na fila de versos, inclusive sem acentos. As setas, Home e End percorrem os resultados visíveis enquanto o ensaio continua.

- Sala de ensaio com navegação para reprodução, fila de versos e arquivos, capa em alto contraste e monitor redesenhado.

Selecione um verso e clique em **Repetir verso atual**. O player usa a marca do verso seguinte como fim. No último verso, usa o fim do áudio. Clique em play para ouvir e em **Limpar** para sair da repetição.

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
