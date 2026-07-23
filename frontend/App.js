import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  Linking,
  Image,
  Keyboard 
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';

// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://nzmybllvrjrvyjalstgw.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_K0Z-bZLmDjQOrrmsVMM0uQ_CeMsNgWK';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MI_TELEFONO_MEDIADOR = "18295581414"; 

export default function App() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [telefonoVendedor, setTelefonoVendedor] = useState(''); 
  const [comision, setComision] = useState(0);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [subiendo, setSubiendo] = useState(false); 

  useEffect(() => {
    fetchPublicaciones();
  }, []);

  const fetchPublicaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .order('created_at', { ascending: false }); // Trae de más nuevo a más viejo

      if (error) {
        console.error('Error al traer datos de Supabase: ', error.message);
      } else {
        setPublicaciones(data || []);
      }
    } catch (err) {
      console.error('Error general en fetchPublicaciones: ', err.message);
    }
  };

  const handlePrecioChange = (valor) => {
    setPrecio(valor);
    const numero = parseFloat(valor);
    if (!isNaN(numero)) {
      setComision(Math.floor(numero * 0.10)); 
    } else {
      setComision(0);
    }
  };

  const handleSeleccionarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permiso Denegado", "Necesitamos acceso a tus fotos para poder subirlas al Market.");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], 
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoSeleccionada(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo abrir la galería de fotos.");
    }
  };

  const subirFotoASupabase = async (uri) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const nombreArchivo = `${Date.now()}.jpg`;

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const { data: publicUrlData } = supabase.storage
              .from('fotos_publicaciones')
              .getPublicUrl(nombreArchivo);
            resolve(publicUrlData.publicUrl);
          } catch (e) {
            console.error("Error URL pública:", e.message);
            resolve(null);
          }
        } else {
          console.error("Supabase rechazó imagen:", xhr.status);
          resolve(null);
        }
      };

      xhr.onerror = (e) => {
        console.error("Error de red:", e);
        resolve(null);
      };

      xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/fotos_publicaciones/${nombreArchivo}`);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: nombreArchivo,
        type: 'image/jpeg',
      });

      xhr.send(formData);
    });
  };

  const handlePublicar = async () => {
    if (!titulo || !precio || !descripcion || !telefonoVendedor) {
      Alert.alert("Atención", "Por favor, llena todos los campos, incluyendo tu teléfono.");
      return;
    }

    setSubiendo(true); 
    Keyboard.dismiss(); 
    let fotoUrlFinal = null;

    if (fotoSeleccionada) {
      fotoUrlFinal = await subirFotoASupabase(fotoSeleccionada);
      if (!fotoUrlFinal) {
        Alert.alert("Aviso", "La foto falló. Guardando datos del formulario...");
      }
    }

    const { error } = await supabase
      .from('publicaciones')
      .insert([
        { 
          titulo: titulo, 
          precio: parseFloat(precio), 
          descripcion: descripcion,
          telefono_vendedor: telefonoVendedor,
          imagen: fotoUrlFinal 
        }
      ]);

    setSubiendo(false); 

    if (error) {
      Alert.alert("Error", `No se pudo registrar: ${error.message}`);
    } else {
      Alert.alert("¡Éxito!", "Tu artículo ha sido publicado en Market_Venta.");
      setTitulo('');
      setPrecio('');
      setDescripcion('');
      setTelefonoVendedor('');
      setComision(0);
      setFotoSeleccionada(null);
      fetchPublicaciones(); 
    }
  };

  const handleContactarMediador = (articulo) => {
    const mensaje = `Hola Héctor, me interesa el artículo "${articulo.titulo}". Quisiera coordinar la compra o hacer una oferta.`;
    const url = `https://wa.me/${MI_TELEFONO_MEDIADOR}?text=${encodeURIComponent(mensaje)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
    });
  };

  const formatearDinero = (cantidad) => {
    if (!cantidad) return "0";
    return Math.floor(cantidad).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // DISEÑO DE LA TARJETA REUTILIZABLE
  const renderTarjetaComponent = (item) => (
    <View style={styles.tarjeta} key={item.id.toString()}>
      <Text style={styles.idTexto}>Ref: #{item.id}</Text>
      
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.tarjetaFoto} />
      ) : (
        <View style={styles.tarjetaSinFoto}>
          <Text style={styles.textoSinFoto}>📦 Sin Foto Disponible</Text>
        </View>
      )}

      <Text style={styles.tarjetaTitulo}>{item.titulo}</Text>
      <Text style={styles.tarjetaPrecio}>${formatearDinero(item.precio)}</Text>
      <Text style={styles.tarjetaDescripcion}>{item.descripcion}</Text>
      
      <TouchableOpacity 
        style={styles.botonContactar}
        onPress={() => handleContactarMediador(item)}
      >
        <Text style={styles.textoBotonContactar}>💬 Contactar por WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => renderTarjetaComponent(item);

  // EL ENCABEZADO DE LA LISTA INCLUYE EL FORMULARIO Y LA SECCIÓN DE VIEJOS
  const renderHeaderFormulario = () => (
    <View>
      <View style={styles.formulario}>
        <Text style={styles.label}>Título del artículo en venta</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. Diferencial Mack 4.11" 
          placeholderTextColor="#94a3b8"
          value={titulo}
          onChangeText={setTitulo}
        />

        <Text style={styles.label}>Precio de Venta ($)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. 110000" 
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={precio}
          onChangeText={handlePrecioChange}
        />
        
        {comision > 0 && (
          <Text style={styles.textoComision}>Ganancia Mediador (10%): ${formatearDinero(comision)}</Text>
        )}

        <Text style={styles.label}>Descripción / Estado</Text>
        <TextInput 
          style={[styles.input, styles.inputArea]} 
          placeholder="Detalles de la pieza, uso..." 
          placeholderTextColor="#94a3b8"
          multiline={true}
          numberOfLines={3}
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Tu Teléfono Celular (Vendedor)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Ej. 8295551234" 
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          value={telefonoVendedor}
          onChangeText={setTelefonoVendedor}
        />

        <TouchableOpacity style={styles.botonFoto} onPress={handleSeleccionarFoto} disabled={subiendo}>
          <Text style={styles.textoBotonFoto}>
            {fotoSeleccionada ? "✓ ¡Foto Cargada!" : "📸 Añadir Foto del Artículo"}
          </Text>
        </TouchableOpacity>

        {fotoSeleccionada && (
          <Image source={{ uri: fotoSeleccionada }} style={styles.vistaPreviaFoto} />
        )}

        <TouchableOpacity 
          style={[styles.botonPublicar, subiendo && styles.botonDeshabilitado]} 
          onPress={handlePublicar}
          disabled={subiendo}
        >
          <Text style={styles.textoBoton}>
            {subiendo ? "Publicando en el Market..." : "🚀 Publicar en el Market"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Si quedan más elementos, ponemos el título de viejos abajo del formulario */}
      {publicaciones.length > 1 && (
        <Text style={styles.subHeader}>Artículos Anteriores</Text>
      )}
    </View>
  );

  // Separamos la última publicación de la lista
  const publicacionReciente = publicaciones.length > 0 ? publicaciones[0] : null;
  // El resto de la lista para abajo
  const publicacionesViejas = publicaciones.length > 1 ? publicaciones.slice(1) : [];

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={publicacionesViejas}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={
          <View>
            <Text style={styles.header}>🚚 Market_Venta</Text>
            
            {/* 1. SECCIÓN SUPERIOR: ÚLTIMA PUBLICACIÓN REGISTRADA */}
            {publicacionReciente && (
              <View>
                <Text style={styles.subHeaderTop}>✨ Lo Último Publicado</Text>
                {renderTarjetaComponent(publicacionReciente)}
              </View>
            )}

            {/* 2. SECCIÓN MEDIA: EL FORMULARIO */}
            {renderHeaderFormulario()}
          </View>
        }
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
      />
    </KeyboardAvoidingView>
  );
}

// ESTILOS AJUSTADOS CON ESTRUCTURA LIMPIA DE ESPACIOS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#071630' },
  scrollContainer: { padding: 20, paddingTop: 50 },
  header: { fontSize: 32, fontWeight: '900', color: '#ffffff', textAlign: 'center', marginBottom: 15 },
  subHeaderTop: { fontSize: 20, fontWeight: 'bold', color: '#4ade80', marginBottom: 10, marginTop: 5 }, // Estilo verde llamativo para la reciente
  subHeader: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginTop: 25, marginBottom: 15 },
  formulario: { backgroundColor: '#0f2447', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#1e3a67', marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: '#132d56', borderWidth: 1, borderColor: '#244b84', borderRadius: 8, padding: 12, fontSize: 16, color: '#ffffff' },
  inputArea: { textAlignVertical: 'top', height: 80 },
  textoComision: { fontSize: 15, color: '#4ade80', fontWeight: 'bold', marginTop: 5 },
  botonFoto: { backgroundColor: '#132d56', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#244b84', borderStyle: 'dashed' },
  textoBotonFoto: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  vistaPreviaFoto: { width: '100%', height: 180, borderRadius: 8, marginTop: 10, resizeMode: 'cover' },
  botonPublicar: { backgroundColor: '#244b84', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#3872c4' },
  botonDeshabilitado: { backgroundColor: '#1e293b' },
  textoBoton: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  tarjeta: { backgroundColor: '#0f2447', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#1e3a67' },
  idTexto: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  tarjetaFoto: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' }, 
  tarjetaSinFoto: { width: '100%', height: 100, backgroundColor: '#132d56', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  textoSinFoto: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  tarjetaTitulo: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
  tarjetaPrecio: { fontSize: 20, fontWeight: 'bold', color: '#4ade80', marginVertical: 4 },
  tarjetaDescripcion: { fontSize: 14, color: '#94a3b8', marginBottom: 12 },
  botonContactar: { backgroundColor: '#25d366', padding: 12, borderRadius: 8, alignItems: 'center' },
  textoBotonContactar: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});