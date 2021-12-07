DC=docker-compose
MAIN=api

all:start

init:
	@echo init env
	@cp .env.dist .env
	@echo echo .env:
	@echo
	@cat .env

logs:
	$(DC) logs -f $(MAIN)

down:
	$(DC) down

start:
	$(DC) up -d --build

re: down start

migrate_new: ## Create new migrations inside /migrations folder, need to use name=
	$(DC) exec $(MAIN) ./node_modules/knex/bin/cli.js migrate:make $(name)