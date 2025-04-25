# Sistema de Gestión de Incidentes  

Aplicación full-stack para reportar y administrar tickets de incidentes, con Docker y PostgreSQL.  

## Características  

✅ Crear incidentes con validaciones:  
- Nombre del reportero (no vacío y sin solo espacios)  
- Descripción (mínimo 10 caracteres)  

✅ Buscar incidentes por ID  

✅ Actualizar estados:  
- Pendiente  
- En proceso  
- Resuelto  

✅ Eliminar incidentes con confirmación  

✅ Interfaz responsiva 

## Tecnologías  

🖥️ **Frontend**: HTML5, CSS3, JavaScript  

⚙️ **Backend**: Node.js + Express  

🗄️ **Base de datos**: PostgreSQL  

🐳 **Contenedores**: Docker + Nginx  

## Instalación  

1. Clonar el repositorio:  
```bash
git clone https://github.com/Luisfer2211/Incidentes2.git
cd Incidentes2
```

2. Iniciar los servicios:  
```bash
docker-compose up --build
```

3. Acceder a:  
- Frontend: [http://localhost:1122](http://localhost:1122)  
- API: [http://localhost:2211/api/incidents](http://localhost:2211/api/incidents)  

## Uso  

📝 **Crear incidente**:  
- Llenar nombre y descripción  
- Presionar "Crear" o Enter  

🔍 **Buscar**:  
- Ingresar ID  
- Presionar "Buscar" o Enter  

🔄 **Actualizar**:  
- Seleccionar nuevo estado en el dropdown  

🗑️ **Eliminar**:  
- Click en "Eliminar" y confirmar  

## Estructura del proyecto  

```
Incidentes2/
├── backend/          # Código del API
│   ├── apifuncional.js
│   ├── package.json
│   └── Dockerfile
├── frontend/         # Interfaz web
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml # Configuración de contenedores
```

## Solución de problemas  

🔧 **Error 502**: Verificar que los contenedores estén corriendo:  
```bash
docker ps -a
```  

🔧 **Problemas con la base de datos**: Reconstruir los volúmenes:  
```bash
docker-compose down -v && docker-compose up
```  

🔧 **Puertos ocupados**: Verificar que los puertos 1122 y 2211 estén libres  





*Luis Fernando Palacios López*
