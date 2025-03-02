import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Guayaquil"); // Establece la zona horaria por defecto
dayjs.locale("es");

export default dayjs;
