import { pool } from '../services/database';

async function seed() {
  try {
    console.log('Seeding database...');

    // Seed sensors
    const sensors = [
      { name: '온도 센서 1', type: 'temperature', location: '구역 A', unit: '℃' },
      { name: '습도 센서 1', type: 'humidity', location: '구역 A', unit: '%' },
      { name: 'CO₂ 센서 1', type: 'co2', location: '구역 A', unit: 'ppm' },
      { name: '조도 센서 1', type: 'light', location: '구역 A', unit: 'lux' },
      { name: '토양 수분 센서 1', type: 'soil_moisture', location: '구역 A', unit: '%' },
      { name: '토양 EC 센서 1', type: 'soil_ec', location: '구역 A', unit: 'dS/m' },
    ];

    for (const sensor of sensors) {
      await pool.query(
        'INSERT INTO sensors (name, type, location, unit) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [sensor.name, sensor.type, sensor.location, sensor.unit]
      );
    }
    console.log(`Seeded ${sensors.length} sensors`);

    // Seed actuators
    const actuators = [
      { name: '난방기 1', type: 'heater', location: '구역 A' },
      { name: '환기팬 1', type: 'fan', location: '구역 A' },
      { name: '차광 스크린 1', type: 'screen', location: '구역 A' },
      { name: 'CO₂ 공급기 1', type: 'co2_supply', location: '구역 A' },
      { name: '관수 밸브 1', type: 'irrigation', location: '구역 A' },
    ];

    for (const actuator of actuators) {
      await pool.query(
        'INSERT INTO actuators (name, type, location) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [actuator.name, actuator.type, actuator.location]
      );
    }
    console.log(`Seeded ${actuators.length} actuators`);

    // Seed robots
    const robots = [
      { name: '방제 로봇 1', type: 'spraying', location: { x: 0, y: 0 } },
      { name: '수확 로봇 1', type: 'harvesting', location: { x: 10, y: 10 } },
      { name: '운반 로봇 1', type: 'logistics', location: { x: 5, y: 5 } },
    ];

    for (const robot of robots) {
      await pool.query(
        'INSERT INTO robots (name, type, location) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [robot.name, robot.type, JSON.stringify(robot.location)]
      );
    }
    console.log(`Seeded ${robots.length} robots`);

    // Seed sample rules
    const rules = [
      {
        name: '고온 시 환기',
        condition: {
          type: 'sensor',
          sensorType: 'temperature',
          operator: '>',
          threshold: 30,
        },
        action: {
          type: 'actuator',
          actuatorId: 2, // 환기팬
          status: 'on',
        },
        priority: 10,
      },
      {
        name: '저습도 시 가습',
        condition: {
          type: 'sensor',
          sensorType: 'humidity',
          operator: '<',
          threshold: 40,
        },
        action: {
          type: 'actuator',
          actuatorId: 1, // 가습기 (가정)
          status: 'on',
        },
        priority: 5,
      },
      {
        name: '토양 수분 부족 시 관수',
        condition: {
          type: 'sensor',
          sensorType: 'soil_moisture',
          operator: '<',
          threshold: 20,
        },
        action: {
          type: 'actuator',
          actuatorId: 5, // 관수 밸브
          status: 'on',
        },
        priority: 15,
      },
    ];

    for (const rule of rules) {
      await pool.query(
        'INSERT INTO rules (name, condition_json, action_json, priority) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [rule.name, JSON.stringify(rule.condition), JSON.stringify(rule.action), rule.priority]
      );
    }
    console.log(`Seeded ${rules.length} rules`);

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

