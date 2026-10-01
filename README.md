# Shipment Service Testing Practice

Proyecto NestJS sencillo para practicar pruebas unitarias de servicios con un repository de TypeORM simulado.

## Preparación

```bash
npm install
```

## Objetivo

Crea `src/shipments/shipments.service.spec.ts` y desarrolla los seis casos indicados en el enunciado del taller.

```bash
npm test
```

Las pruebas unitarias no requieren Docker ni PostgreSQL. La configuración de base de datos se incluye únicamente para permitir ejecutar la API de forma opcional.

## Archivos que no deben modificarse

- `src/shipments/shipments.service.ts`
- `src/shipments/shipment-rules.service.ts`
- `src/shipments/entities/shipment.entity.ts`
- `src/shipments/dto/create-shipment.dto.ts`

El trabajo debe concentrarse en el archivo de pruebas.




## Utilización de la IA

### 1. resetAllMocks

**Herramienta consultada:** Claude

**Pregunta:** ¿Qué diferencia hay entre `clearAllMocks` y `resetAllMocks` en Jest? En la guía de clase se usa `clearAllMocks` y no sé cuál conviene.

**Respuesta:** Se explicó que `clearAllMocks` solo borra el historial de llamadas (cuántas veces se llamó un mock y con qué argumentos), mientras que `resetAllMocks` borra el historial y también lo que se configuró con `mockResolvedValue`, `mockReturnValue` o `mockImplementation`. Con `clearAllMocks`, una configuración como la de `ConflictException` podría quedarse activa en los tests siguientes.

**Decisión:** Usé `resetAllMocks` en el `beforeEach` para que cada test empiece con los mocks limpios y ninguno dependa de lo que configuró otro.

### 2. Importar jest desde @jest/globals

**Herramienta consultada:** Claude

**Pregunta:** ¿Por qué debo escribir `import { jest } from '@jest/globals'` si en la guía no aparecía?

**Respuesta:** Se explicó que mi script de test usa `--experimental-vm-modules`, y en ese modo el objeto `jest` no está disponible de forma global, por lo que hay que importarlo. Funciones como `describe`, `it` y `expect` siguen siendo globales.

**Decisión:** Agregué el import al inicio de mi archivo de pruebas para que `jest.fn()` y `jest.resetAllMocks()` funcionen.

### 3. findOneBy en lugar de findOne

**Herramienta consultada:** Claude

**Pregunta:** En `ShipmentsService` se usa `findOneBy({ id })`. ¿En qué se diferencia de `findOne` y cuál debo simular en mi test?

**Respuesta:** Se explicó que `findOneBy` recibe directamente la condición, mientras que `findOne` recibe un objeto con `where`. Ambos devuelven el registro o `null`. En el test hay que simular el método que usa el servicio, es decir, `findOneBy`.

**Decisión:** Definí `findOneBy` en mi `repositoryMock` y comprobé que se llame con `{ id: 7 }`, tal como lo hace el servicio.

### 4. jest.fn con tipos genéricos

**Herramienta consultada:** Claude

**Pregunta:** No entiendo qué significa `jest.fn<(where: any) => Promise<ShipmentEntity | null>>()`, se ve muy complicado.

**Respuesta:** Se explicó que lo que va entre `< >` le dice a TypeScript qué recibe y qué devuelve la función simulada. Sin eso, `mockResolvedValue` da error de tipos. La parte `Promise<ShipmentEntity | null>` significa que la función devuelve una promesa de un envío o de `null`.

**Decisión:** Entendí que es solo para que TypeScript no marque error y mantuve los tipos en cada mock de mi `repositoryMock`.

### 5. rejects.toBeInstanceOf

**Herramienta consultada:** Claude

**Pregunta:** ¿Cómo compruebo en un test que un método lanza una excepción si el método es asíncrono?

**Respuesta:** Se explicó que `rejects` espera a que la promesa falle y `toBeInstanceOf(NotFoundException)` comprueba que el error sea de ese tipo. Por eso se escribe `await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException)`.

**Decisión:** Lo usé en el test donde el shipment no existe y en el test donde la regla rechaza el despacho, siempre con `await`.

### 6. expect.objectContaining

**Herramienta consultada:** Claude

**Pregunta:** ¿Para qué sirve `expect.objectContaining` dentro de `toHaveBeenCalledWith`?

**Respuesta:** Se explicó que permite comprobar solo algunas propiedades de un objeto (por ejemplo `id` y `status`) sin exigir que el objeto completo sea idéntico.

**Decisión:** Lo usé en el test de `dispatch` para verificar que `save` recibe el envío con estado `DISPATCHED`.

### 7. mockImplementation para simular un error

**Herramienta consultada:** Claude

**Pregunta:** ¿Cómo hago que el servicio de reglas falso lance un error si `mockResolvedValue` solo sirve para respuestas exitosas?

**Respuesta:** Se explicó que `mockImplementation` permite definir el comportamiento completo del mock, incluido lanzar una excepción con `throw`. Así se simula que la regla real rechaza el despacho.

**Decisión:** Lo usé en el último test para lanzar `ConflictException` y comprobar que `save` nunca se ejecuta cuando la regla falla.