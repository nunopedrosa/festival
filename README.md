# Festival 1.1.0

PWA estática para comparar feriados de países de todo o mundo. HTML, CSS e JavaScript; sem servidor de aplicação, contas, APIs de calendário ou consultas externas durante o cálculo.

## GitHub e DreamHost

Repositório público: https://github.com/nunopedrosa/festival

O projeto inclui `scripts/deploy.sh` para executar por SSH no DreamHost. Mantém o checkout fora da pasta pública e publica só os ficheiros estáticos, sem npm/Python no servidor:

```sh
mkdir -p "$HOME/repos"
git clone https://github.com/nunopedrosa/festival.git "$HOME/repos/festival"
cd "$HOME/repos/festival"
bash scripts/deploy.sh /home/YOUR_SHELL_USER/YOUR_WEBSITE_DIRECTORY
```

Substituir o último argumento pela pasta pública **existente** configurada no DreamHost. Nas atualizações, repetir apenas o comando `bash scripts/deploy.sh …`: o script faz `git pull --ff-only`, recusa alterações locais/divergência e preserva ficheiros alheios e um `.htaccess` existente. O manifesto `deploy-files.txt` e os recursos prontos têm de estar publicados no repositório.

Instruções completas, cabeçalhos de cache e limites da publicação: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Experimentar

O projeto já inclui todos os ficheiros prontos. Não é necessário instalar npm para o utilizar.

1. Extrair a pasta `festival` para o computador.
2. Nessa pasta, iniciar um servidor estático, por exemplo: `python3 -m http.server 8010`.
3. Abrir http://localhost:8010 no navegador.

Não abrir index.html por `file://`: instalação, armazenamento e service worker precisam de uma origem HTTP/HTTPS adequada. Em localhost é possível preparar o modo offline; noutros dispositivos/endereço da rede local é necessário HTTPS para instalar/preparar o offline. A consulta comum pode funcionar por HTTP.

Para alojamento próprio, copiar os ficheiros de `dist/` (gerada por `npm run build`) ou os ficheiros equivalentes na raiz: index.html, styles.css, app.js, icons.js, engine.js, i18n.js, manifest.webmanifest, version.json, precache.js, sw.js, assets/, vendor/ e docs/DATA_SOURCES.md. Preservar a estrutura de pastas. O servidor não usa Node, npm, PHP nem base de dados. Pode ser alojada numa subpasta. HTTPS é necessário para as funcionalidades PWA. Configurar revalidação (`Cache-Control: no-cache`) para HTML, sw.js, precache.js e version.json.

## Interface

- Países favoritos, ordenação manual e seleção de uma região/localidade ou todas as subdivisões disponíveis por país.
- Grelha: uma linha por data e uma coluna de 44 px por país, identificada pelo código (PT, ES, FR…) e a bandeira por baixo, com símbolos SVG embutidos diretamente. Os nomes completos continuam disponíveis nos favoritos, detalhes e etiquetas acessíveis. Data fixa à esquerda; cabeçalhos fixos; deslocamento horizontal apenas dentro da grelha.
- Vista Agenda para consulta no telemóvel.
- Todos os dias ou só datas com eventos; filtro de coincidências; escolha de ano e mês; Hoje.
- Feriados nacionais e regionais/locais, bancários e filtro adicional para facultativos/observâncias/dias escolares.
- Natal, Páscoa, Ano Novo, dias cívicos, celebrações islâmicas e símbolo genérico. R indica âmbito regional/local; + indica vários eventos. Os ícones são atalhos visuais, não classificações religiosas exaustivas.
- Detalhes com nomes, data/dia da semana, âmbito, localidades, tipo, regra e fonte.
- Português europeu e inglês. Nomes de feriados sem tradução usam o idioma disponível.

## Dados

251 entradas: os 249 países/territórios ISO, Kosovo e Ilhas Canárias. O catálogo JavaScript date-holidays 3.38.0 calcula os feriados de 207 entradas localmente. Para as restantes 44, o pacote inclui tabelas anuais 2000–2050 calculadas na preparação a partir de Python holidays 0.107, preservando nomes originais, datas estimadas e limites históricos da fonte. Nenhuma destas consultas exige serviços de calendário ou Python no navegador/servidor.

As tabelas suplementares cobrem o âmbito nacional; as subdivisões variam nos restantes países. Uma célula ? ou mensagem de cobertura indica ausência de eventos disponíveis no ano/filtros escolhidos. Territórios desabitados podem não ter feriados nacionais definidos. Não se inventam datas fora do período suportado pela fonte.
Cobertura municipal **parcial**, explicitada na aplicação. Portugal inclui Açores, Madeira, Lisboa e Porto; não inclui todos os municípios. A Madeira inclui 2 abril desde 2025, 1 julho e 26 dezembro. Consultar docs/DATA_SOURCES.md e vendor/ATTRIBUTION.md. A cobertura não corresponde a uma auditoria oficial integral de todos os países/anos nem à garantia de que todos os trabalhadores têm folga.

A consulta está limitada a 2000–2050. Mudanças legais e datas dependentes de anúncio oficial são distribuídas por atualizações do catálogo/aplicação. Não há consultas de fundo a serviços de calendário.

## Offline, instalação e atualizações

A primeira visita prepara a aplicação e todo o catálogo (cerca de 3,8 MB de JavaScript não comprimido, mais bandeiras e licenças). Só indica Pronto para uso offline após confirmar todos os recursos essenciais na cache do service worker. Sem service worker/contexto seguro, a consulta funciona online e o estado não promete preparação offline.

As atualizações são verificadas ao abrir/regressar e manualmente nas Definições. Uma nova versão espera pela ação Atualizar aplicação; o número comunicado pelo service worker tem de diferir da versão em execução. A versão anterior completa fica disponível durante a preparação. No máximo duas caches de versões são mantidas. As preferências não são apagadas.

## Preferências e cópias

Só existem preferências locais: países e ordem, regiões, idioma, ano, mês, modo, vista e filtros. localStorage usa uma única gravação por configuração, revisão para detetar conflitos entre janelas e aviso se o armazenamento falhar. Sem sincronização.

Definições → Dados e cópias de segurança permite exportar/importar JSON (`application: festival`, `schemaVersion: 1`), até 256 KiB, máximo 251 entradas únicas. A importação valida e apresenta uma pré-visualização com Restaurar preferências marcado por omissão; substitui as preferências após confirmação. Desmarcar mantém todas as preferências atuais, pois não há outros registos nesta app. Cancelamento, validação inválida, conflito e falha de gravação mantêm o estado anterior. O catálogo/cache não faz parte da cópia e acompanha a aplicação.

## Desenvolvimento

Opcional, apenas para alterar/reconstruir o motor:

```sh
npm ci
npm run build
npm test
```

`dist/` é uma saída descartável, não precisa de npm no servidor. O bundle do motor e catálogo já está incluído na raiz. Ao editar qualquer ficheiro runtime, reconstruir dist/precache antes de publicar. Para uma nova versão atualizar app.js, sw.js (nome de cache e resposta VERSION), version.json, package.json e CHANGELOG.md em conjunto.

Mapa: docs/ARCHITECTURE.md. Decisões: docs/DECISIONS.md. Validação e limitações: docs/STATUS.md. Regras comuns: docs/SHARED_PWA_RULES.md e AGENTS.md.

## Verificação

Testes automáticos dos cálculos, regiões, substituições, preferências e cópias; simulação do service worker. Interface inspecionada num Chrome atual, incluindo larguras 320/375 e janela baixa em iframe. Não equivale a testar Safari 12 ou um iPhone físico. Instalação real e ciclo offline/atualização numa origem HTTPS ainda precisam de validação em dispositivo. O ambiente de pré-visualização HTTP não permitiu essa validação completa.

## Atualizar de 1.0.0 para 1.0.1

Substituir os ficheiros pelo pacote completo, incluindo o novo icons.js. Se a PWA já estiver instalada: Definições → Procurar atualizações → Atualizar aplicação. As preferências guardadas e o formato das cópias mantêm-se. Não é necessário apagar os dados do site.

A versão 1.0.2 acrescenta bandeiras SVG locais por baixo de cada código de país, sem aumentar a largura de 44 px das colunas. Substituir também assets/flags/ ao atualizar.

## Atualização 1.1.0

A barra do calendário usa seletores com o mesmo tamanho e estilo, mantendo os controlos numa linha quando há espaço e em duas linhas no telemóvel. O cabeçalho passa a Feriados do mundo. O novo pacote substitui vendor/europe-data.js por vendor/world-data.js e acrescenta vendor/country-names.js e vendor/supplement-data.js, carregados antes de engine.js. Substituir o pacote completo e usar Procurar atualizações → Atualizar aplicação; as preferências e cópias anteriores continuam compatíveis.

Para manutenção opcional das tabelas suplementares: instalar scripts/requirements-data.txt num ambiente Python e executar python3 scripts/generate-supplement.py. Não é necessário para servir ou usar a aplicação, nem para reconstruir os ficheiros estáticos a partir dos dados já incluídos.

## Shared deployment command (2026-11-01)

See [the current deployment contract](docs/SHARED_DEPLOYMENT.md) and `scripts/deploy-profile.sh`. This supersedes older script flags, SSH-only wrappers and broad deletion instructions below/above; hosting coordinates and app-specific private/release requirements still apply. No deployment is authorized by source changes.
