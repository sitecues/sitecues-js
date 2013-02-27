all:
	@npm install

run:
	@./binary/web $(port)

build:
	@./binary/compile