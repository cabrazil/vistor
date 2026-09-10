# Vistor — MVP de Vistoria de Espaços do Condomínio

Você é um engenheiro de software sênior responsável por iniciar o desenvolvimento do **Vistor**, uma aplicação PWA (Progressive Web App) mobile-first para realizar vistorias de espaços compartilhados de um condomínio através de um smartphone.

## 1. Objetivo do projeto

O Vistor tem como objetivo substituir o checklist em papel/planilha utilizado atualmente na vistoria do **Salão de Festas** do condomínio.

O usuário deve conseguir realizar uma vistoria diretamente pelo celular, registrando:

* ambiente;
* item vistoriado;
* condição do item;
* observações;
* quantidade, quando aplicável;
* fotografias/evidências;
* responsável pela vistoria;
* data e hora.

O sistema deve suportar dois momentos distintos para cada reserva:

1. **Vistoria de entrega** — realizada antes da utilização do salão;
2. **Vistoria de devolução** — realizada após o evento.

O conceito fundamental do sistema é permitir comparar o estado do salão na entrega com o estado na devolução.

---

# 2. Escopo do MVP

O MVP será utilizado inicialmente por **um único condomínio** e terá apenas uma área operacional:

```text
Condomínio
   └── Áreas
        └── Salão de Festas
             ├── Ambientes
             ├── Itens
             └── Reservas
                  ├── Vistoria de entrega
                  └── Vistoria de devolução
```

Apesar de o banco e a arquitetura deverem permitir expansão futura para outros espaços, NÃO desenvolver neste momento funcionalidades completas para outros tipos de áreas.

O código deve ser estruturado para permitir futuramente:

```text
Condomínio
├── Salão de Festas
├── Churrasqueira
├── Espaço Gourmet
├── Academia
├── Salão de Jogos
└── etc.
```

Mas o MVP deve trabalhar apenas com o Salão de Festas.

---

# 3. Stack tecnológica

Utilizar preferencialmente:

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* PWA
* React Router
* arquitetura baseada em componentes reutilizáveis

### Backend

* Node.js
* Fastify
* TypeScript
* Prisma ORM
* PostgreSQL

### Armazenamento

As fotografias devem ser tratadas como arquivos independentes dos registros de vistoria.

A arquitetura deve permitir armazenamento em:

* S3-compatible storage; ou
* storage próprio no servidor.

Não armazenar imagens diretamente como BLOB no PostgreSQL.

### PWA

A aplicação deve:

* funcionar muito bem em smartphones;
* ser responsiva;
* permitir instalação como PWA;
* utilizar a câmera do dispositivo quando possível;
* apresentar interface otimizada para uso com uma mão;
* possuir botões grandes e claros;
* minimizar digitação durante a vistoria.

---

# 4. Princípio de UX

A pessoa que realiza a vistoria provavelmente estará caminhando pelo salão utilizando apenas o celular.

Portanto:

**A vistoria deve exigir o mínimo possível de digitação.**

Priorizar:

* seleção por botões;
* cards;
* indicadores visuais;
* navegação "Anterior / Próximo";
* captura rápida de foto;
* campos de texto somente quando necessários.

O fluxo deve ser extremamente simples:

```text
Reserva
   ↓
Iniciar vistoria
   ↓
Escolher ambiente
   ↓
Ver item
   ↓
Selecionar condição
   ↓
Foto/observação se necessário
   ↓
Próximo item
   ↓
Finalizar ambiente
   ↓
Finalizar vistoria
   ↓
Assinatura/confirmação
```

---

# 5. Condições dos itens

Cada item deve possuir uma condição durante a vistoria.

Utilizar inicialmente:

* OK
* COM_RESSALVA
* DANIFICADO
* AUSENTE
* NA

A interface deve apresentar essas opções de maneira visual e fácil de tocar.

Exemplo:

```text
┌─────────────────────────────┐
│ Mesa 04                     │
│                             │
│ Quantidade: 1               │
│                             │
│ [ ✓ OK ]                    │
│ [ ! RESSALVA ]              │
│ [ ✕ DANIFICADO ]            │
│ [ ? AUSENTE ]               │
│ [ — N/A ]                   │
│                             │
│ Observação                  │
│ __________________________  │
│                             │
│ [ 📷 Adicionar foto ]       │
│                             │
│        [ PRÓXIMO ]          │
└─────────────────────────────┘
```

---

# 6. Regra importante sobre ocorrências

Quando o usuário selecionar:

* COM_RESSALVA
* DANIFICADO
* AUSENTE

o sistema deve incentivar o registro de uma observação.

Para DANIFICADO e AUSENTE, considerar a observação como obrigatória no MVP.

Para DANIFICADO, disponibilizar captura de fotografia.

Exemplo:

```text
Item: Mesa 04

Condição:
[ DANIFICADO ]

Descrição:
"Risco profundo no tampo, lado direito."

[ 📷 Fotografar ]

[ SALVAR E CONTINUAR ]
```

---

# 7. Vistoria de entrega e devolução

Esse é um dos principais conceitos do Vistor.

Uma reserva poderá possuir:

```text
Reserva
 ├── Vistoria de entrega
 └── Vistoria de devolução
```

A vistoria de devolução deve utilizar como referência os itens existentes na vistoria de entrega.

Na devolução, apresentar ao vistoriador informações relevantes da entrega.

Exemplo:

```text
Mesa 04

ENTREGA
✓ OK

DEVOLUÇÃO
✕ DANIFICADO

[ Registrar ocorrência ]
```

O sistema deve permitir identificar posteriormente alterações entre os dois momentos.

---

# 8. Reserva

Uma reserva deve conter inicialmente:

* identificador;
* área;
* unidade/apartamento;
* responsável;
* data do evento;
* horário inicial;
* horário final;
* status.

Status sugeridos:

```text
AGENDADA
EM_VISTORIA_ENTREGA
EM_USO
AGUARDANDO_DEVOLUCAO
CONCLUIDA
CANCELADA
```

Não criar neste momento um sistema complexo de reservas/calendário.

O MVP pode possuir uma tela administrativa simples para cadastrar e visualizar reservas.

---

# 9. Ambientes

O Salão de Festas deve possuir ambientes configuráveis.

Exemplos:

```text
Salão principal
Cozinha
Banheiros
Churrasqueira
Área externa
Equipamentos
```

Não assumir que essa lista é definitiva.

Os ambientes devem ser armazenados no banco e relacionados à área.

---

# 10. Itens

Cada ambiente possui itens que serão vistoriados.

Exemplos:

### Salão principal

* Piso
* Paredes
* Teto
* Iluminação
* Mesas
* Cadeiras
* Sofás
* TV
* Ar-condicionado

### Cozinha

* Geladeira
* Freezer
* Micro-ondas
* Forno
* Cooktop
* Pia
* Torneira
* Bancadas

### Banheiros

* Vasos sanitários
* Torneiras
* Espelhos
* Iluminação
* Portas
* Lixeiras

### Churrasqueira

* Churrasqueira
* Grelha
* Bancada
* Pia
* Torneira

Esses dados devem ser tratados como configuração e não hardcoded na interface.

---

# 11. Quantidade

Alguns itens possuem quantidade.

Exemplo:

```text
Cadeiras
Quantidade prevista: 40
Quantidade conferida: 40
```

Enquanto outros representam apenas uma unidade:

```text
TV
Quantidade: 1
```

O modelo deve permitir:

* quantidade esperada;
* quantidade encontrada/conferida.

Isso será particularmente importante para móveis e utensílios.

---

# 12. Fotografias

Uma fotografia deve estar relacionada a uma entidade específica.

Exemplo:

```text
Vistoria
   └── Item vistoriado
         └── Foto
```

Cada foto deve possuir pelo menos:

* id;
* URL/path;
* data/hora;
* vistoria;
* item;
* tipo/evidência.

A interface deve permitir tirar foto diretamente pelo smartphone.

Evitar obrigar o usuário a selecionar uma imagem da galeria quando a câmera estiver disponível.

---

# 13. Finalização da vistoria

Ao finalizar:

```text
VISTORIA CONCLUÍDA

62 itens verificados

✓ 59 OK
! 2 com ressalva
✕ 1 danificado
? 0 ausentes

[ CONFIRMAR VISTORIA ]
```

Registrar:

* data/hora de início;
* data/hora de conclusão;
* usuário responsável;
* status da vistoria.

Após finalizada, uma vistoria não deve ser alterada silenciosamente.

Se houver necessidade futura de correção, projetar o modelo para permitir auditoria/versionamento.

Não é necessário implementar um complexo sistema de auditoria no primeiro MVP, mas a arquitetura não deve impedir isso.

---

# 14. Assinatura / confirmação

No MVP, implementar uma confirmação simples do responsável.

Preferencialmente:

* nome do responsável;
* confirmação de ciência;
* data/hora;
* identificação da vistoria.

Se for simples implementar assinatura desenhada na tela, pode ser incluída.

Caso aumente significativamente a complexidade, deixar a assinatura manuscrita para uma segunda fase e implementar inicialmente apenas confirmação eletrônica.

---

# 15. Relatório

O sistema deverá futuramente gerar um relatório da vistoria.

No MVP, preparar a arquitetura para isso.

O relatório deverá conter:

* condomínio;
* área;
* reserva;
* unidade;
* responsável;
* data/hora;
* itens;
* condições;
* observações;
* fotografias;
* ocorrências;
* resultado da comparação entre entrega e devolução.

A geração de PDF pode ser implementada no MVP se não comprometer o fluxo principal.

Caso contrário, deixar como próxima etapa.

---

# 16. Dashboard inicial

Criar uma tela inicial simples.

Exemplo:

```text
VISTOR

Salão de Festas

┌─────────────────────────────┐
│ Próxima reserva             │
│ Apto 84                     │
│ Hoje — 18:00                │
│                             │
│ [ INICIAR VISTORIA ]        │
└─────────────────────────────┘

Reservas recentes

#184  Apto 84   Concluída
#183  Apto 32   Concluída
#182  Apto 71   Aguardando devolução
```

Não criar gráficos ou dashboards complexos neste momento.

---

# 17. Modelo de dados

Propor um modelo Prisma coerente com a seguinte estrutura:

```text
Condominium
    └── Area
          ├── Environment
          │      └── InspectionItem
          │
          └── Reservation
                  ├── DeliveryInspection
                  │      └── InspectionItemResult
                  │              └── InspectionPhoto
                  │
                  └── ReturnInspection
                         └── InspectionItemResult
                                 └── InspectionPhoto
```

Avaliar cuidadosamente os nomes das entidades e relacionamentos antes de implementar.

Evitar duplicação desnecessária entre DeliveryInspection e ReturnInspection.

Uma alternativa aceitável é utilizar uma única entidade `Inspection` com:

```text
type:
DELIVERY
RETURN
```

desde que o modelo continue deixando clara a relação entre as duas inspeções.

---

# 18. API

Criar uma API REST organizada.

Exemplos:

```text
GET    /api/areas
GET    /api/areas/:id
GET    /api/environments/:id/items

GET    /api/reservations
POST   /api/reservations
GET    /api/reservations/:id

POST   /api/inspections
GET    /api/inspections/:id
PATCH  /api/inspections/:id

POST   /api/inspections/:id/items/:itemId/result
POST   /api/inspections/:id/items/:itemId/photos

POST   /api/inspections/:id/complete
```

Os endpoints podem ser ajustados conforme o modelo final.

Utilizar:

* validação de entrada;
* tratamento consistente de erros;
* DTOs/schemas;
* HTTP status codes apropriados;
* autenticação preparada para evolução futura.

---

# 19. Autenticação

O MVP deve possuir uma autenticação simples para impedir acesso público ao sistema.

Não é necessário implementar neste momento:

* múltiplos condomínios comerciais;
* planos;
* cobrança;
* RBAC complexo;
* integração com sistemas condominiais.

Porém, a arquitetura deve permitir isso no futuro.

---

# 20. Segurança

Como serão armazenadas fotografias e informações relacionadas a moradores/reservas:

* não expor arquivos privados diretamente sem controle;
* validar uploads;
* limitar tamanho e tipo de arquivo;
* sanitizar entradas;
* proteger endpoints;
* não confiar em dados enviados pelo frontend;
* utilizar variáveis de ambiente para credenciais;
* não versionar secrets;
* aplicar princípios básicos de LGPD.

---

# 21. PWA e experiência mobile

O celular é o dispositivo principal.

Priorizar:

* carregamento rápido;
* interface responsiva;
* touch targets grandes;
* feedback visual imediato;
* funcionamento em conexões móveis;
* recuperação de estado em caso de interrupção.

Considerar uma estratégia de persistência local temporária para evitar perda de dados caso o usuário perca momentaneamente a conexão.

Não implementar offline-first completo no primeiro momento sem necessidade.

---

# 22. Arquitetura do projeto

Antes de escrever grande quantidade de código:

1. analisar os requisitos;
2. propor arquitetura;
3. propor modelo de dados;
4. propor estrutura de pastas;
5. identificar decisões técnicas;
6. identificar riscos;
7. somente depois iniciar a implementação.

Não criar código desnecessário.

Priorizar simplicidade, manutenção e evolução.

---

# 23. Seed inicial

Criar seed para um condomínio de demonstração:

```text
Condomínio Demo
└── Salão de Festas
    ├── Salão principal
    ├── Cozinha
    ├── Banheiros
    ├── Churrasqueira
    ├── Área externa
    └── Equipamentos
```

Cadastrar itens representativos em cada ambiente.

Criar também algumas reservas fictícias para permitir testar o fluxo completo.

---

# 24. Critérios de sucesso do MVP

O MVP será considerado funcional quando for possível realizar integralmente este cenário:

```text
Login
  ↓
Visualizar reserva
  ↓
Iniciar vistoria de entrega
  ↓
Percorrer ambientes
  ↓
Conferir itens
  ↓
Marcar OK / ressalva / danificado / ausente
  ↓
Registrar observação
  ↓
Tirar fotografia
  ↓
Finalizar vistoria
  ↓
Confirmar responsável
  ↓
Posteriormente iniciar vistoria de devolução
  ↓
Visualizar condição registrada na entrega
  ↓
Conferir novamente os itens
  ↓
Registrar alterações
  ↓
Finalizar devolução
  ↓
Visualizar resumo das ocorrências
```

Esse fluxo é o **coração do Vistor**.

---

# 25. O que NÃO implementar no MVP

Não implementar agora:

* aplicativo nativo Android/iOS;
* marketplace;
* cobrança;
* multi-tenant comercial completo;
* integração com portaria;
* integração com sistemas de condomínio;
* notificações complexas;
* WhatsApp;
* reconhecimento automático de danos por IA;
* OCR;
* assinatura digital certificada;
* relatórios analíticos avançados;
* calendário complexo;
* gestão financeira;
* manutenção predial;
* chamados;
* gestão de funcionários.

Essas funcionalidades podem ser consideradas futuramente, mas não devem interferir no desenvolvimento do MVP.

---

# 26. Forma de trabalho

Desenvolva o projeto em etapas pequenas e verificáveis.

### Fase 1

Arquitetura + banco + migrations + seed.

### Fase 2

Backend/API.

### Fase 3

Frontend base + autenticação.

### Fase 4

Cadastro/visualização de áreas, ambientes e itens.

### Fase 5

Reservas.

### Fase 6

Fluxo de vistoria de entrega.

### Fase 7

Fotografias e ocorrências.

### Fase 8

Vistoria de devolução + comparação.

### Fase 9

Resumo/relatório.

### Fase 10

PWA, testes, segurança e refinamento mobile.

Após cada fase, validar o que foi implementado antes de avançar.

---

# 27. Primeira tarefa

NÃO comece imediatamente criando todas as telas.

Primeiro:

1. analise este documento;
2. proponha o modelo de dados;
3. proponha o schema Prisma;
4. proponha a arquitetura frontend/backend;
5. proponha a estrutura de diretórios;
6. proponha os principais endpoints;
7. apresente as principais decisões técnicas e eventuais dúvidas;
8. aguarde aprovação antes de iniciar a implementação completa.

O objetivo é construir um MVP **simples, sólido e realmente utilizável no celular**, evitando overengineering.

O nome oficial da aplicação é **Vistor**.

Eu acrescentaria uma decisão importante ao projeto: **não começaria pelo CRUD**. O que diferencia o Vistor não é cadastrar ambientes e itens; é tornar a **vistoria física extremamente rápida no celular** e depois conseguir responder à pergunta:

> **"O que mudou entre a entrega e a devolução do salão?"**

Esse deve ser o eixo do produto.

O Vistor inicialmente como um projeto bem enxuto: **React/PWA + Fastify + Prisma + PostgreSQL**, exatamente como um pequeno produto real, mas sem tentar transformá-lo agora em SaaS. Depois que o condomínio utilizar de verdade, teremos evidências para decidir o próximo passo.
