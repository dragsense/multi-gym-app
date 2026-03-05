import { registerAs } from '@nestjs/config';

export interface MqttConfig {
  url: string;
  clientId: string;
  publisherClientId: string;
  topics: string[];
  enabled: boolean;
}

export default registerAs('mqtt', (): MqttConfig => ({
  url: process.env.MQTT_URL || 'mqtt://mqtt:1883',
  /** Client ID for microservice listener (server) */
  clientId: process.env.MQTT_CLIENT_ID || 'template-mqtt-server',
  /** Client ID for publisher (must differ from listener when both in same app) */
  publisherClientId: process.env.MQTT_PUBLISHER_CLIENT_ID || 'template-mqtt-publisher',
  topics: (process.env.MQTT_TOPICS || 'template/#').split(',').map((t) => t.trim()),
  enabled: false, // process.env.MQTT_ENABLED === 'true', 
}));
