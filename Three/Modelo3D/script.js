var renderer, scene, camera, markerGroup;
var gltfModel = null;
var statusElement = document.getElementById('status');
var errorElement = document.getElementById('error');

renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0px';
renderer.domElement.style.left = '0px';
document.body.appendChild(renderer.domElement);

scene = new THREE.Scene();
camera = new THREE.Camera();
scene.add(camera);

markerGroup = new THREE.Group();
scene.add(markerGroup);

var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 0.5).normalize();
scene.add(directionalLight);

function loadGLTFModel(modelPath) {
    var loader = new THREE.GLTFLoader();
    
    loader.load(
        modelPath,
        function(gltf) {
            gltfModel = gltf.scene;
            
            gltfModel.scale.set(0.5, 0.5, 0.5); 
            gltfModel.position.x = 0;
            gltfModel.position.y = 0;
            gltfModel.position.z = 30 * Math.PI / 100;;

            gltfModel.rotation.x = -100 * Math.PI / 180;
            
            markerGroup.add(gltfModel);
            
            statusElement.textContent = 'Modelo cargado. Busca el marcador Hiro...';
            console.log('Modelo GLTF cargado exitosamente');
        },
        function(xhr) {
            var porcentaje = (xhr.loaded / xhr.total * 100).toFixed(2);
            statusElement.textContent = 'Cargando modelo: ' + porcentaje + '%';
        },
        function(error) {
            console.error('Error al cargar el modelo:', error);
            errorElement.textContent = 'Error al cargar el modelo GLTF: ' + error.message;
            errorElement.style.display = 'block';
            
            cargarGeometriaRespaldo();
        }
    );
}

function cargarGeometriaRespaldo() {
    var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
    var material = new THREE.MeshNormalMaterial();
    var torus = new THREE.Mesh(geometry, material);
    torus.position.y = 0;
    markerGroup.add(torus);
    
    statusElement.textContent = 'Usando geometría de respaldo. Busca el marcador Hiro...';
}

var source = new THREEAR.Source({ renderer: renderer, camera: camera });

THREEAR.initialize({ source: source, lostTimeout: 1000 }).then((controller) => {
    
    loadGLTFModel('model/lowpoly_human_heart.glb');
    
    var patternMarker = new THREEAR.PatternMarker({
        patternUrl: 'data/patt.hiro',
        markerObject: markerGroup,
        minConfidence: 0.3
    });
    
    controller.trackMarker(patternMarker);
    
    controller.addEventListener('markerFound', function(event) {
        console.log('Marcador encontrado', event);
        statusElement.textContent = 'Marcador detectado - Mostrando modelo';
        statusElement.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
    });
    
    controller.addEventListener('markerLost', function(event) {
        console.log('Marcador perdido', event);
        statusElement.textContent = 'Buscando marcador...';
        statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    });
    
    var lastTimeMsec = 0;
    requestAnimationFrame(function animate(nowMsec) {
        requestAnimationFrame(animate);
        
        lastTimeMsec = lastTimeMsec || nowMsec - 1000/60;
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;
        
        controller.update(source.domElement);
        
        if (gltfModel) {
            gltfModel.rotation.y += deltaMsec/2000 * Math.PI;
        }
        
        renderer.render(scene, camera);
    });
    
}).catch(function(error) {
    console.error('Error al inicializar AR:', error);
    errorElement.textContent = 'Error al inicializar AR: ' + error.message;
    errorElement.style.display = 'block';
});

window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('error', function(event) {
    console.error('Error global:', event);
    errorElement.textContent = 'Error: ' + event.message;
    errorElement.style.display = 'block';
});