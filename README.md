# Lyrics Sync ♪

![Lyrics Sync](cover.svg)

Um player de letras para quem ensaia, compõe ou quer compartilhar o verso atual no Discord. Abra um arquivo LRC e acompanhe cada linha pelo relógio do player.

**Experimente em 12 segundos** · Requer Python 3.10+. Baixe os arquivos da mesma branch e abra o terminal na pasta.

```sh
python lyrics.py demo.lrc
```

No Windows, você também pode usar `py` no lugar de `python`. A demo contém uma letra original e roda offline. Para acompanhar uma gravação, inicie o áudio junto com o comando. Para retomar a partir de 45 segundos, use `python lyrics.py sua-letra.lrc --start 45`.

## Compartilhar no Discord

Com o Discord Desktop aberto e o compartilhamento de atividade habilitado, crie um aplicativo no [Developer Portal](https://discord.com/developers/applications), copie o **Application ID** e execute:

```sh
python -m pip install -r requirements-discord.txt
python lyrics.py demo.lrc --client-id SEU_APPLICATION_ID
```

O aplicativo usa Rich Presence local. O terminal acompanha cada linha e a presença envia no máximo uma atualização a cada 15 segundos. Use uma faixa mais longa para observar várias atualizações. A sessão termina no último timestamp. Adicione uma linha com o horário final em branco para manter o último verso até o fim da música.

## English quick start

Run `python lyrics.py demo.lrc` for an offline, timed lyric preview. Start your audio separately. Use your own UTF-8 LRC file or add `--start SECONDS` to seek. Optional Discord desktop sharing uses an application ID. Personal account tokens are never required.

## Desenvolvimento

`python -m unittest -v` verifica timestamps repetidos, offset, linhas simultâneas, silêncio, retomada e intervalo de publicação. [Histórico](CHANGELOG.md) · [MIT](LICENSE)
