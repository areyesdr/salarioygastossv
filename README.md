# MiNominaSV

Aplicación web en React 19, TypeScript, React Router, Motion y Tailwind CSS para el cálculo exacto de descuentos de ley, prestaciones laborales, costo real por hora trabajada y control de gastos personales en El Salvador (normativa vigente 2026 y obligatoriedad de Quincena 25 en 2027).

## Qué resuelve esta aplicación

1. **Descuentos de ley (Mensual y Quincenal)**:
   - **AFP Empleado (7.25%)** y **AFP Patronal (8.75%)**.
   - **ISSS Empleado (3%)** con tope salarial cotizable de `$1,000.00` mensuales (`$30.00` máximo al mes o `$15.00` por quincena) e **ISSS Patronal (7.5%)** con tope de `$75.00`.
   - **INSAFORP / INCAF Patronal (1%)** referencial.
   - **Renta (ISR)** calculada sobre la renta gravada (`Salario Bruto - AFP - ISSS`) según las tablas progresivas de retención del Ministerio de Hacienda (Decreto Legislativo N.º 254).
   - Simulación de bonos o comisiones adicionales (fijos o variables) y su efecto en el tramo de Renta.

2. **Prestaciones y bonos de ley**:
   - **Vacación Anual (Art. 177 Código de Trabajo)**:
     - Cálculo de 15 días de salario base más el recargo legal del **30%** sobre dichos 15 días (`(Salario / 2) * 30%`).
     - Comparativa entre las dos modalidades habituales de pago en planilla:
       1. *Depósito solo del bono 30%*: el salario quincenal ordinario sigue su curso normal y el 30% se deposita por separado.
       2. *Pago adelantado completo (15 días + 30%)*: liquidación conjunta con deducción de AFP, ISSS e ISR diferencial.
     - Opción para dividir la vacación en tramos (Semana Santa, Fiestas Agostinas, Fin de año) y modalidad de Sector Público (Ley de Salarios / Servicio Civil).
   - **Aguinaldo (Arts. 196 a 202 Código de Trabajo y Decretos 669, 670 y 673)**:
     - Cálculo por tramos de antigüedad al 12 de diciembre:
       - **1 a menos de 3 años**: 15 días de salario.
       - **3 a menos de 10 años**: 19 días de salario.
       - **10 años o más**: 21 días de salario.
       - **Menos de 1 año**: cálculo proporcional por días trabajados hasta el 12 de diciembre (`(Salario / 30 * 15) * (días / 365)`).
     - Ventana de pago autorizada entre el **1 de octubre y el 20 de diciembre** (Decretos 669 y 670).
     - Exención de ISR hasta **`$1,500.00`** (Decreto 673) o regla general de 2 salarios mínimos del sector comercio (`$817.60`), con cálculo de ISR únicamente sobre el excedente.
   - **Quincena 25 (Decreto Legislativo N.º 499, obligatoria en enero de 2027)**:
     - Pago equivalente al **50% del salario nominal mensual** para trabajadores con salario mensual de hasta **`$1,500.00`**.
     - Pago entre el **15 y el 25 de enero** de cada año.
     - **100% exenta** de descuentos de ISSS, AFP y retención de Renta (ISR).
     - Cálculo proporcional al tiempo trabajado durante el año anterior (al 25 de enero) si la antigüedad es menor a 1 año.

3. **Costo por hora, salario diario y horas extra**:
   - Cálculo de valor por día y por hora tanto sobre el **salario bruto** como sobre el **salario líquido real** (después de ISSS, AFP y Renta), configurable según días laborales al mes (por defecto 30 días contables o 22 días efectivos) y horas por jornada (por defecto 8 horas).
   - Calculadora de horas extra según el Código de Trabajo:
     - Hora extra diurna (`2.00x`, recargo del 100%).
     - Hora extra nocturna (`2.25x`, recargo del 100% más 25% de nocturnidad).
     - Trabajo en día de descanso (`1.50x` diurno / `1.75x` nocturno).
     - Trabajo en día de asueto remunerado (`2.00x` diurno / `2.25x` nocturno).

4. **Control de gastos personales y destino de bonos (`/mis-gastos`)**:
   - Registro de gastos fijos y variables clasificados por categoría y por quincena (1.ª quincena, 2.ª quincena o mensual).
   - Conversión automática de cada gasto a **horas de trabajo neto**, permitiendo visualizar cuántas horas reales de jornada requiere cubrir cada compromiso financiero.
   - Distribución y presupuesto para los ingresos extraordinarios del año (`Vacación 30%`, `Aguinaldo` y `Quincena 25`).

5. **Seguridad, Control de Accesos (RBAC + ID Matching) y Cumplimiento Legal en El Salvador**:
   - **Rutas Protegidas (`ProtectedRoute.tsx`) y Roles**:
     - *Invitado (Anónimo)*: Acceso a la calculadora pública (`/`), `/login`, `/terminos` y `/privacidad`. Si intenta acceder a `/mis-gastos` es redirigido a `/401`.
     - *Usuario Registrado (`user`)*: Acceso a `/mis-gastos` con validación de propiedad (`ID Matching` por `ownerId`), impidiendo modificar o consultar registros de terceros. Si intenta acceder a `/admin` es redirigido a `/403`.
     - *Administrador (`admin`)*: Acceso a `/admin` con métricas globales anonimizadas del sistema.
   - **Catálogo de Páginas de Error y Límite de Errores (`ErrorBoundary`)**:
     - Vistas dedicadas para estados `401 (No autenticado)`, `403 (Acceso denegado)`, `404 (No encontrado)`, `500 (Error interno capturado por react-error-boundary sin exponer trazas sensibles)` y `502/503 (Mantenimiento temporal)`.
   - **Términos y Condiciones (`/terminos`) y Política de Privacidad con Derechos ARCO (`/privacidad`)**:
     - Cláusulas de exoneración de responsabilidad (disclaimer), margen de error, propiedad intelectual, identificación del proveedor conforme a la Ley de Comercio Electrónico de El Salvador y jurisdicción en los tribunales de San Salvador.
     - Panel interactivo para ejercer **Derechos ARCO** (Acceso/exportación en `.json`, Rectificación de datos y Cancelación/borrado total de cuenta e historial).

---

## Tablas oficiales de referencia (El Salvador)

### Retención mensual de ISR (Asalariados)

| Tramo | Renta Gravada Mensual (`Salario - AFP - ISSS`) | Porcentaje | Cuota Fija | Sobre exceso de |
| :--- | :--- | :--- | :--- | :--- |
| **Tramo I** | `$0.01` a `$550.00` | Exento | `$0.00` | `$0.00` |
| **Tramo II** | `$550.01` a `$895.24` | `10%` | `$17.67` | `$550.00` |
| **Tramo III** | `$895.25` a `$2,038.10` | `20%` | `$60.00` | `$895.24` |
| **Tramo IV** | `$2,038.11` en adelante | `30%` | `$288.57` | `$2,038.10` |

### Retención quincenal de ISR (Asalariados)

| Tramo | Renta Gravada Quincenal | Porcentaje | Cuota Fija | Sobre exceso de |
| :--- | :--- | :--- | :--- | :--- |
| **Tramo I** | `$0.01` a `$275.00` | Exento | `$0.00` | `$0.00` |
| **Tramo II** | `$275.01` a `$447.62` | `10%` | `$8.83` | `$275.00` |
| **Tramo III** | `$447.63` a `$1,019.05` | `20%` | `$30.00` | `$447.62` |
| **Tramo IV** | `$1,019.06` en adelante | `30%` | `$144.28` | `$1,019.05` |

---

## Requisitos y ejecución con `pnpm`

```bash
# Instalar dependencias
pnpm install

# Ejecutar entorno de desarrollo
pnpm dev

# Ejecutar pruebas unitarias (cálculos laborales + seguridad RBAC / ID Matching)
pnpm test

# Auditar vulnerabilidades de dependencias
pnpm audit

# Compilar para producción
pnpm build
```
