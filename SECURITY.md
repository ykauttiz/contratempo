# Política de segurança

## Versões cobertas

Só a versão da branch `main`, publicada na [demonstração](https://ykauttiz.github.io/contratempo/), recebe correções. Contratempo é um projeto pessoal mantido por uma pessoa, e não há prazo garantido de resposta.

## Como relatar

1. Se a aba **Security** do repositório tiver o botão **Report a vulnerability**, use-o. O relato fica privado.
2. Se o botão não estiver disponível, abra uma [issue](https://github.com/ykauttiz/contratempo/issues/new/choose) com o título "Segurança: resumo", descrevendo o **impacto** e sem o passo a passo de exploração nem dados reais. O mantenedor combina um canal privado antes de qualquer detalhe técnico.

Nunca publique tokens, senhas ou dados de terceiros em um relato.

## O que interessa

- Um arquivo LRC ou uma sessão JSON que consiga injetar HTML ou executar código na página.
- Qualquer caminho em que o áudio ou a letra do usuário saia do navegador sem ação dele.
- Os exportadores (`lyrics.py`, `exports.py`) gravando fora do destino pedido ou sobrescrevendo arquivos sem aviso.

## Fora de escopo

- Pedidos de recurso e erros de cálculo sem impacto de segurança: use [Relatar um problema](https://github.com/ykauttiz/contratempo/issues/new/choose).
- Falhas em serviços de terceiros (GitHub, Discord, plataformas de delivery): relate ao serviço.

## O que o código faz com os dados

O código do aplicativo não usa telemetria nem scripts de terceiros e não envia os dados do usuário a um servidor. A presença opcional no Discord, ativada por você no terminal, usa o aplicativo Discord instalado no seu computador. A hospedagem na GitHub Pages registra acessos como qualquer site estático. Ausência de alertas não prova ausência de falhas.
