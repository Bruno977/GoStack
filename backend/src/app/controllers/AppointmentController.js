import * as Yup from "yup";
import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from "date-fns/locale/pt";
import User from "./../models/User";
import File from "./../models/File";
import Appointment from "./../models/Appointment";
import Notification from "../schemas/Notification";
import Mail from "../../lib/Mail";
import CancellationMail from "../jobs/CancellationMail";
import Queue from "../../lib/Queue";

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ["date"],
      attributes: ["id", "date", "past", "cancelable"],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["id", "name"],
          include: [
            {
              model: File,
              as: "avatar",
              attributes: ["id", "path", "url"],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Erro de validação" });
    }

    const { provider_id, date } = req.body;

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res.status(401).json({ error: "Acesso restrito" });
    }

    const hourStart = startOfHour(parseISO(date));

    //checando se a data é no passado
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: "Data inválida para agendamento!" });
    }

    //chegado se tem disponibilidade pra agendamento
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id: provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: "Sem vagas para essa data, marque outra" });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    //Notifica o prestador de serviço

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' HH:mm'h'",
      {
        locale: pt,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["name", "email"],
        },

        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
    });

    if (appointment.user_id != req.userId) {
      return res.status(401).json({ error: "Você não tem permissão" });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: "Você não pode cancelar o agendamento a menos de 2 horas.",
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save();

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: "Agendamento Cancelado!",
      template: "cancellation",
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'dia' dd 'de' MMMM', às' HH:mm'h'", {
          locale: pt,
        }),
      },
    });

    await Queue.add(CancellationMail.key, {
      appointment,
    });
    return res.json(appointment);
  }
}

export default new AppointmentController();
