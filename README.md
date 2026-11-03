# LIARE — site completo e exportação para GitHub/Vercel

Cópia do site publicado em 03/11/2026, versão 128.

Este pacote inclui o código-fonte, catálogo, todas as imagens e fontes locais, estilos, scripts, testes existentes e a versão pronta para publicação em `dist/`.
O funcionamento preservado é: catálogo, páginas de produto, sacola persistida no navegador e pedido enviado pelo WhatsApp.
**Não inclui checkout de pagamento, cálculo automático de frete, backend, banco de pedidos ou integração com Supabase. Essas funções ainda precisam ser desenvolvidas.**

## Conteúdo

- `src/`: arquivos editáveis, fotos e catálogo em `src/data/products.json`.
- `scripts/`: montagem do site e testes.
- `dist/`: arquivos publicados e prontos para hospedagem estática.
- `package.json`: comandos do projeto, sem dependências externas de build.
- `vercel.json`: configuração para Vercel, com saída em `dist/`.
- `README-ORIGINAL.md`: documentação técnica completa do projeto original; as instruções de hospedagem deste README prevalecem nesta cópia portátil.
- `EXPORTACAO.json`: versão e origem desta cópia.

Não foram incluídos histórico `.git`, credenciais, configuração interna da hospedagem anterior nem o arquivo de publicação antigo dentro deste ZIP.

## GitHub

1. Extraia o ZIP.
2. Crie um repositório no GitHub, preferencialmente privado.
3. Envie o conteúdo da pasta extraída, mantendo `package.json`, `vercel.json`, `src/`, `scripts/` e `dist/` na raiz do repositório.
4. Preserve os arquivos ocultos, incluindo `.gitignore`.

O GitHub guarda e versiona o código. A publicação descrita abaixo é feita na Vercel.

## Vercel

1. Importe o repositório do GitHub como um projeto na Vercel.
2. Use a pasta que contém `package.json` como Root Directory.
3. Framework Preset: Other.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. O projeto não precisa de Install Command nem de variáveis de ambiente para reproduzir o funcionamento atual. Essas opções estão declaradas em `vercel.json`.
7. Publique primeiro no endereço de prévia fornecido pela Vercel e confira a navegação, os produtos, as fotos e a sacola.

A publicação pela Vercel não foi executada neste preparo. Não altere o DNS do domínio atual antes de validar a nova hospedagem.
Escolha um plano de hospedagem que permita o uso comercial da LIARE conforme os termos vigentes da Vercel.

## Testar e editar localmente

Use Node.js em versão LTS suportada pelo seu ambiente. O projeto original declara Node >=18 e não usa React ou Next.js.

```sh
npm run build
npm run check
npm test
```

Para visualizar `dist/`, use um servidor HTTP local, por exemplo, se tiver Python instalado:

```sh
python -m http.server 8080 --directory dist
```

Abra http://localhost:8080. Não abra os arquivos HTML diretamente com `file://`, pois o catálogo é carregado por `fetch`.

Edite os arquivos em `src/` e gere novamente `dist/`. O script não exclui arquivos obsoletos automaticamente; se remover um produto ou uma imagem, revise também a saída.

## Domínio, prévias e catálogo Meta

A configuração `src/data/sharing.json` continua apontando para `https://www.liarehandmade.com.br`, como no site atual. Isso preserva os links canônicos e as prévias de compartilhamento. Se for publicar definitivamente em outro domínio, altere `siteUrl` nesse arquivo e rode o build novamente.

O feed `dist/meta-catalog.csv` é gerado a partir do catálogo a cada build. Seu endereço público é `/meta-catalog.csv`. Depois de uma migração, confira se o Meta continua buscando esse arquivo no domínio correto.

O navegador guarda a sacola por domínio. Uma prévia em outro endereço terá uma sacola independente. O site atual e seu DNS não foram alterados.

## Onde entra o Supabase

O Supabase pode ser usado futuramente como banco de dados, autenticação, armazenamento e funções de backend. Ele não é necessário para hospedar esta versão estática: os arquivos são publicados pela Vercel.

Subir este ZIP não cria tabelas nem conecta o site ao Supabase. Não há chaves ou projeto Supabase configurados. A futura integração deve prever pedidos, itens, pagamentos, frete e permissões de acesso.
Credenciais privadas do Mercado Pago, Melhor Envio e chaves de serviço do Supabase devem ficar no servidor; nunca nos arquivos públicos do site.

## Referências oficiais

- Vercel: https://vercel.com/docs/project-configuration/vercel-json
- Supabase: https://supabase.com/docs/guides/platform/custom-domains
