# Relatório de Segurança — TechStore Secrets Lab

## Objetivo

Este documento registra os problemas de segurança identificados durante a revisão DevSecOps do projeto TechStore Secrets Lab, bem como os riscos, as correções aplicadas e suas respectivas justificativas.

A análise concentrou-se no gerenciamento de segredos, exposição de informações, privilégios de acesso, registros da aplicação, configuração do Docker e ciclo de vida das credenciais.

---

## Problema 1 — Arquivo `.env` versionado

### Local

Arquivo `.env`.

### Problema identificado

O arquivo `.env`, contendo senhas, tokens e chaves de API, estava armazenado diretamente no repositório Git.

Embora as credenciais utilizadas no laboratório sejam fictícias, esse comportamento representa uma prática insegura que não deve ser reproduzida em ambientes reais.

### Risco

Qualquer pessoa com acesso ao repositório, a um fork, a um clone ou ao histórico Git poderia recuperar os valores armazenados no arquivo.

Em um ambiente real, essa exposição poderia permitir acesso indevido ao banco de dados, APIs internas, serviços de pagamento e outros recursos protegidos.

### Correção aplicada

O arquivo `.env` foi removido do rastreamento do Git e incluído no `.gitignore`.

Também foi criado o arquivo `.env.example`, contendo somente os nomes das variáveis necessárias e valores ilustrativos.

### Justificativa

A aplicação continua documentando quais variáveis devem ser configuradas sem armazenar os respectivos segredos no repositório.

Cada ambiente deve fornecer seus próprios valores por meio de variáveis de ambiente ou de um gerenciador de segredos.

---

## Problema 2 — Credenciais armazenadas em `credentials.json`

### Local

Arquivo `config/credentials.json`.

### Problema identificado

O projeto possuía um arquivo JSON contendo credenciais de banco de dados, token de API interna e outras informações sensíveis.

Além de estar versionado, esse arquivo duplicava segredos já presentes em outros pontos do projeto.

### Risco

A duplicação de credenciais aumenta a superfície de exposição e dificulta sua rotação.

Mesmo que uma credencial fosse alterada em um arquivo, uma cópia antiga poderia continuar disponível em outro local ou no histórico Git.

### Correção aplicada

O arquivo `config/credentials.json` foi removido do projeto e incluído no `.gitignore` para impedir uma inclusão futura acidental.

As configurações necessárias passaram a ser obtidas exclusivamente por variáveis de ambiente.

### Justificativa

Centralizar a obtenção dos segredos reduz duplicações, inconsistências e risco de exposição.

A aplicação passa a depender de uma única estratégia de configuração, adequada para ambientes locais, pipelines e produção.

---

## Problema 3 — Credenciais hardcoded no código-fonte

### Local

Arquivo `src/config.js`.

### Problema identificado

O código continha endereço, porta, nome do banco, usuário privilegiado e senha escritos diretamente na função de configuração.

### Risco

Credenciais hardcoded ficam disponíveis para qualquer pessoa que consiga ler o código-fonte ou o histórico do repositório.

Essa prática também impede que ambientes de desenvolvimento, teste e produção utilizem configurações independentes de forma segura.

### Correção aplicada

Os valores fixos foram removidos e substituídos por variáveis de ambiente.

Também foi implementada uma validação das variáveis obrigatórias. A aplicação encerra sua inicialização com uma mensagem clara caso alguma configuração necessária esteja ausente.

### Justificativa

Separar código e configuração permite utilizar credenciais diferentes em cada ambiente sem alterar o código-fonte.

A validação antecipada também evita que a aplicação seja iniciada com configuração incompleta ou comportamento imprevisível.

---

## Problema 4 — Uso de usuário privilegiado para acesso ao banco

### Local

Arquivos `src/config.js`, `src/database.js` e `docker-compose.yml`.

### Problema identificado

A aplicação estava configurada para utilizar o usuário `root` do banco de dados.

Esse usuário possui privilégios administrativos muito superiores aos necessários para uma aplicação comum.

### Risco

Se a aplicação ou sua credencial fosse comprometida, um invasor poderia obter controle administrativo sobre o banco, incluindo criação e remoção de usuários, alteração de permissões e exclusão de dados.

### Correção aplicada

A aplicação passou a utilizar o usuário configurado em `DB_USER`, separado do usuário administrativo.

No Docker Compose, o MySQL cria o usuário de aplicação utilizando `MYSQL_USER` e `MYSQL_PASSWORD`. A credencial administrativa permanece separada em `DB_ROOT_PASSWORD`.

### Justificativa

A alteração aplica o princípio do menor privilégio: a aplicação deve utilizar somente as permissões necessárias para executar suas operações.

Em um ambiente real, esse usuário também deve receber permissões restritas apenas ao banco e às operações utilizadas pela aplicação.

---

## Problema 5 — Segredos hardcoded no Docker Compose

### Local

Arquivo `docker-compose.yml`.

### Problema identificado

O Docker Compose continha senhas do banco escritas diretamente no arquivo de infraestrutura.

Também existiam valores duplicados e mais de uma definição da senha administrativa do MySQL.

### Risco

Arquivos de infraestrutura normalmente são versionados e compartilhados entre desenvolvedores e pipelines.

Manter credenciais nesses arquivos expõe os valores no repositório, no histórico Git, em revisões de código e em ferramentas de integração contínua.

Definições duplicadas ainda podem causar comportamento inconsistente e dificultar a identificação da credencial efetivamente utilizada.

### Correção aplicada

Os valores fixos foram substituídos por referências às variáveis `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.

O Compose agora exige que as variáveis essenciais estejam configuradas antes de iniciar os serviços.

### Justificativa

O arquivo continua descrevendo a infraestrutura sem armazenar os valores sensíveis.

Os segredos podem ser fornecidos de forma independente em cada ambiente por um arquivo local ignorado pelo Git ou, em produção, por uma solução apropriada de gerenciamento de segredos.

---

## Problema 6 — Banco de dados exposto ao host

### Local

Serviço `database` no arquivo `docker-compose.yml`.

### Problema identificado

A porta `3306` do MySQL estava publicada diretamente no host.

Isso permitia tentativas de conexão com o banco sem passar pela aplicação.

### Risco

A exposição desnecessária da porta aumenta a superfície de ataque.

Um invasor com acesso à rede poderia tentar explorar vulnerabilidades do MySQL, realizar ataques de força bruta ou conectar-se diretamente usando credenciais comprometidas.

### Correção aplicada

O mapeamento externo da porta do MySQL foi removido.

O banco passou a participar exclusivamente da rede interna `backend`. A aplicação participa das redes `frontend` e `backend`, sendo o único componente autorizado a intermediar o acesso externo.

### Justificativa

A aplicação precisa acessar o banco pela rede interna do Docker, mas o usuário externo não precisa acessar diretamente a porta `3306`.

O isolamento preserva a comunicação entre os serviços e reduz a superfície de exposição da infraestrutura.

---

## Problema 7 — Chave de API exposta nos logs de backup

### Local

Arquivo `scripts/backup.js`.

### Problema identificado

A rotina de backup imprimia uma chave de API diretamente no console.

Além disso, o código utilizava uma referência inválida em vez da variável carregada do ambiente.

### Risco

Logs podem ser armazenados por longos períodos e enviados para sistemas de observabilidade, pipelines de CI/CD ou serviços externos.

Uma credencial registrada em log pode permanecer acessível mesmo depois de sua remoção do código-fonte.

A referência inválida também fazia a rotina falhar durante a execução.

### Correção aplicada

A rotina passou a carregar `BACKUP_API_KEY` por variável de ambiente e validar sua presença.

O valor da chave não é mais impresso. O log informa apenas que a credencial foi carregada e que a operação foi concluída.

### Justificativa

Logs devem registrar eventos operacionais, e não os valores utilizados para autenticação.

A validação mantém uma mensagem útil para diagnóstico sem revelar a credencial e sem permitir que a rotina seja executada com configuração incompleta.

---

## Problema 8 — Referências inseguras e inválidas no endpoint de configuração

### Local

Endpoint `/config-check` no arquivo `src/app.js`.

### Problema identificado

O endpoint utilizava nomes que simulavam senhas, chaves e tokens diretamente no código.

Esses identificadores não estavam definidos, o que poderia provocar falhas em tempo de execução.

Além disso, a abordagem incentivava a inclusão de informações sensíveis no código da aplicação.

### Risco

A aplicação poderia responder com erro ao acessar o endpoint.

Caso os valores fossem posteriormente definidos diretamente no código, seriam expostos no repositório e poderiam acabar retornados por engano em uma resposta HTTP.

### Correção aplicada

O endpoint passou a consultar a configuração centralizada carregada por variáveis de ambiente.

A resposta apresenta somente valores booleanos, indicando se cada configuração está presente, sem retornar seu conteúdo.

### Justificativa

O endpoint continua útil para validar a configuração do ambiente, mas não revela senhas, chaves ou tokens.

A utilização de uma configuração centralizada também elimina referências inexistentes e mantém o comportamento consistente.

---

## Problema 9 — Exposição de informação interna no health check

### Local

Endpoint `/health` no arquivo `src/app.js`.

### Problema identificado

O health check retornava o endereço interno do banco de dados.

Essa informação não era necessária para confirmar que a aplicação estava funcionando.

### Risco

Detalhes internos de infraestrutura podem ajudar um invasor a mapear serviços, nomes de hosts e arquitetura da aplicação.

A exposição isolada do nome do banco pode parecer pequena, mas contribui para reconhecimento e ataques mais direcionados.

### Correção aplicada

A resposta do endpoint foi reduzida para:

```json
{
  "status": "healthy"
}
```

O endpoint raiz também retorna apenas o nome da aplicação e seu estado operacional.

### Justificativa

Um health check público deve disponibilizar somente as informações necessárias para monitoramento.

Detalhes técnicos e diagnósticos internos devem ser restritos a mecanismos autenticados ou a ferramentas privadas de observabilidade.

---

## Problema 10 — Ausência de estratégia para o ciclo de vida dos segredos

### Local

Processo de desenvolvimento, histórico Git e documentação do projeto.

### Problema identificado

O projeto não documentava procedimentos de criação, armazenamento, rotação, revogação e substituição de credenciais.

Os segredos removidos dos arquivos atuais continuariam acessíveis nos commits anteriores do repositório.

### Risco

Remover uma credencial em um novo commit não elimina sua presença no histórico Git, em forks, clones, caches, logs ou pipelines.

Se a mesma credencial continuar válida, qualquer pessoa que tenha obtido uma cópia ainda poderá utilizá-la.

A falta de uma estratégia preventiva também facilita a inclusão de novos segredos em commits futuros.

### Correção aplicada

O README e este relatório passaram a orientar que credenciais anteriormente versionadas sejam consideradas comprometidas, revogadas e substituídas.

Também foram adicionados:

- `.gitignore` para impedir o versionamento de arquivos sensíveis;
- `.env.example` sem valores reais;
- `.dockerignore` para evitar o envio do `.env` ao contexto da imagem;
- validação das variáveis obrigatórias;
- orientação para utilização de gerenciadores de segredos em produção;
- revisão do `git status`, `git diff` e busca por possíveis segredos antes do commit.

### Justificativa

O gerenciamento seguro não termina quando o segredo é removido do código.

É necessário controlar todo o ciclo de vida da credencial, incluindo criação, distribuição, armazenamento, uso, rotação, revogação e descarte.

Em produção, devem ser utilizadas soluções como GitHub Actions Secrets, HashiCorp Vault, AWS Secrets Manager, Azure Key Vault ou serviço equivalente.

Caso seja necessário remover valores antigos do histórico, a reescrita deve ser planejada com ferramentas apropriadas, como `git filter-repo`, e coordenada com todos os colaboradores e forks. A reescrita do histórico não substitui a rotação das credenciais.

---

# Melhorias adicionais aplicadas

Além das correções diretamente relacionadas aos dez problemas, foram aplicadas as seguintes melhorias:

- remoção do cabeçalho `X-Powered-By` do Express;
- validação numérica das portas da aplicação e do banco;
- execução do contêiner da aplicação com usuário não privilegiado;
- uso de uma imagem Node.js reduzida;
- cópia somente dos arquivos necessários para a imagem;
- limpeza do cache do npm após a instalação;
- health check do MySQL;
- armazenamento dos dados do MySQL em volume;
- isolamento do banco em rede interna;
- publicação da API somente no endereço local `127.0.0.1`;
- separação entre rede de entrada e rede interna;
- criação de arquivo `.dockerignore`.

---

# Validações realizadas

Após as correções, foram executadas as seguintes validações:

- instalação das dependências com `npm install`;
- execução local da aplicação;
- teste do endpoint `/`;
- teste do endpoint `/health`;
- teste do endpoint `/config-check`;
- execução da rotina de backup;
- construção da imagem da aplicação;
- execução dos serviços com Docker Compose;
- validação do health check do MySQL;
- inspeção dos logs da aplicação e do banco;
- confirmação de que a API foi publicada na porta local configurada;
- confirmação de que a porta do MySQL não foi publicada no host;
- verificação do estado dos arquivos no Git;
- confirmação de que o `.env` não permanece rastreado;
- busca por valores sensíveis antes do commit;
- auditoria das dependências do projeto.

---

# Considerações finais

A revisão reduziu a exposição de informações sensíveis e tornou a configuração da aplicação adequada para diferentes ambientes.

As credenciais presentes na versão original devem ser tratadas como comprometidas, mesmo sendo fictícias neste laboratório. Em um sistema real, elas precisariam ser imediatamente revogadas e substituídas.

A solução adotada demonstra que o gerenciamento de segredos não consiste apenas em ocultar senhas, mas em proteger as credenciais durante todo o seu ciclo de vida.