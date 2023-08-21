import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'

THREE.ColorManagement.enabled = false

/**
 * Debug
 */
const gui = new dat.GUI()
const debugObject = {}

debugObject.createSphere = () => {

    createSphere(
        Math.random() * 0.5, 
        { 
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3,
        }
        )
}

gui.add(debugObject, 'createSphere')

debugObject.createBoxes = () => {
    createBoxes(
        Math.random(),
        Math.random(),
        Math.random(),
        {
            x: (Math.random() - 0.5) * 3,
            y: 3,
            z: (Math.random() - 0.5) * 3, 
        }
    )
}

gui.add(debugObject, 'createBoxes')

debugObject.reset = () =>
{
    for (const object of objectsToUpdate) {
        //remove body
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)

        //remove mesh
        scene.remove(object.mesh)
    }

    objectsToUpdate.splice(0,objectsToUpdate.length)
}

gui.add(debugObject, 'reset')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const hitSound = new Audio('/sounds/hit.mp3')

const playHitSound = (collision) => 
{
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()

    if(impactStrength > 1.5)
    {
        hitSound.volume = Math.random()
        hitSound.currentTime = 0
        hitSound.play()
    }
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])

//Physics

//World

const world = new CANNON.World()

//performance optimization
world.broadphase = new CANNON.SAPBroadphase(world) // testing object if they are colliding in a different way
world.allowSleep = true // if an object has velocity 0 is sleeping and won't be tested


world.gravity.set(0, -9.82, 0)

const concreteMaterial = new CANNON.Material('concrete')
const plasticMaterial = new CANNON.Material('plastic')

//we can simplify by making onli one default material and use it two times if the world isn't so much realistic
const concretePlasticContactMaterial = new CANNON.ContactMaterial(
    concreteMaterial,
    plasticMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
)
world.addContactMaterial(concretePlasticContactMaterial)
//we can remove the materials applied to the bodies and set a defaultcontact material to the world
world.defaultContactMaterial = concretePlasticContactMaterial

//Physic Sphere
// const sphereShape = new CANNON.Sphere(0.5)

// const sphereBody = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0, 3, 0),
//     shape: sphereShape,
//     // material: plasticMaterial
// })

// sphereBody.applyLocalForce(new CANNON.Vec3(150,0,0), new CANNON.Vec3(0, 0, 0))

// world.addBody(sphereBody)

//Physic Floor

const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
// floorBody.material = concreteMaterial
floorBody.mass = 0
floorBody.addShape(floorShape) // can add multiple shapes
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
)
world.addBody(floorBody)


/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(0.5, 32, 32),
//     new THREE.MeshStandardMaterial({
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture,
//         envMapIntensity: 0.5
//     })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5
// scene.add(sphere)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

//Utils
const objectsToUpdate = []
        
const sphereGeometry = new THREE.SphereGeometry(1, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture
})

const createSphere = (radius, position) => {
    //Three.js MEsh
    const mesh = new THREE.Mesh(
        sphereGeometry,
        sphereMaterial
    )
    mesh.scale.set(radius, radius, radius)
    mesh.castShadow = true
    mesh.position.copy(position)
    scene.add(mesh)

    //Cannon.js Body
    const shape = new CANNON.Sphere(radius)

    const body = new CANNON.Body(
        {
            mass: 1,
            position: new CANNON.Vec3(0, 3, 0),
            shape: shape,
            
        }
    )
    body.position.copy(position)
    body.addEventListener('collide', playHitSound)
    world.addBody(body)

    //Save the object
    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

const boxGeometry = new THREE.BoxGeometry(1,1,1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness:0.4,
    envMap: environmentMapTexture
})

const createBoxes = (width, height, depth, position) =>{
    //Mesh
    const boxMesh = new THREE.Mesh(
        boxGeometry,
        boxMaterial
    )
    boxMesh.scale.set(width,height,depth)
    boxMesh.castShadow = true
    boxMesh.position.copy(position)
    scene.add(boxMesh)

    //cannon
    const boxShape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5))
    const boxBody = new CANNON.Body({
        mass: 1,
        shape: boxShape,        
    })
    boxBody.position.copy(position)
    boxBody.addEventListener('collide',playHitSound)
    world.addBody(boxBody)

    objectsToUpdate.push({
        mesh: boxMesh,
        body: boxBody
    })
}

createBoxes(1, 1, 1, {x:2, y:5, z: 2})

createSphere(0.5, {x:0, y: 3, z:0 })

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    //Update Physics World
    // sphereBody.applyForce( new CANNON.Vec3(-0.5, 0, 0), sphereBody.position)
    world.step(1/60, deltaTime, 3)

    //Update Object
    objectsToUpdate.forEach((object)=>{
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    })
    // sphere.position.copy(sphereBody.position)
    // sphere.position.x = sphereBody.position.x
    // sphere.position.y = sphereBody.position.y
    // sphere.position.z = sphereBody.position.z

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()