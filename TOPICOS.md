# Temas de la charla

## Conceptos básicos
* ¿Que es TDD?
* ¿Que es BDD?
* ¿Que es un mock?
* ¿Que es una prueba unitaria?
* ¿Que es una prueba de integración?
* ¿Que es una prueba punta a punta?


# Temas a tratar
1. Probar un componente que ya existe.
    
    1. Pensar que probar.
        1. Roles --> textbox, combobox, checkbox, spinbutton, button
        2. findByText vs findByLabelText
        3. cleanUp en el afterEach
    2. Descubrir dependencias necesarias.
        1. vi.mock
    3. Ciclos de renderizado y respuestas asyncronicas.

2. Interacciones del usuario.

    1. Seleccionar elementos y dar click o escribir.

3. Asertar errores

    1. Probar caminos de error lanzamos excepciones

4. Casos bordes

    1. Llamar a un constructor sin parámetros
    2. Llamar a una función/método sin los parámetros obligatorios
    3. Llamar a una función/método enviando nulos o vacios.

5. Asertar textos

    1. Asertar siempre con el texto hardcodeado en la prueba.

6. Mocking y stubs de dependecias externas

    1. vi.mock(), vi.fn()
    2. Diferencia entre mocks, stubs y spies