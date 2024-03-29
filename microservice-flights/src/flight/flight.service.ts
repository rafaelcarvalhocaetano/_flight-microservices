import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import * as moment from 'moment';

import { CreateFlightDto } from './dto/create-flight.dto';
import { UpdateFlightDto } from './dto/update-flight.dto';
import { Flight } from './entities/flight.entity';
import { FLIGHT } from '../common/model';

@Injectable()
export class FlightService {
  constructor(
    @InjectModel(FLIGHT.name) private readonly model: Model<Flight>,
  ) {}

  async create(createFlightDto: CreateFlightDto): Promise<Flight> {
    const data = new this.model(createFlightDto);
    return await data.save();
  }

  async findAll(): Promise<Flight[]> {
    return await this.model.find().populate('passengers');
  }

  async getLocation(city: string) {
    const weather = await axios.get(
      `${process.env.URL_TEMP}/search/?query=${city}`,
    );
    if (weather?.data.length) {
      return weather.data[0];
    }
    return null;
  }

  async getWeather(woeid: string, date: Date) {
    const dateFormat = moment.utc(date).format();
    const year = dateFormat.substring(0, 4);
    const month = dateFormat.substring(5, 7);
    const day = dateFormat.substring(8, 10);

    const { data } = await axios.get(
      `${process.env.URL_TEMP}/${woeid}/${year}/${month}/${day}`,
    );
    return data;
  }

  assing(
    { _id, pilot, airplane, destinationCity, flightDate, passengers }: Flight,
    weather: any,
  ) {
    return Object.assign({
      _id,
      pilot,
      airplane,
      destinationCity,
      flightDate,
      passengers,
      weather,
    });
  }

  async findOne(id: string): Promise<Flight> {
    const flight = await this.model.findById(id).populate('passengers');
    const location = await this.getLocation(flight.destinationCity);
    let weather = null;
    if (location) {
      weather = await this.getWeather(location.woeid, flight.flightDate);
    }

    return this.assing(flight, weather);
  }

  async update(id: string, updateFlightDto: UpdateFlightDto): Promise<Flight> {
    const data = await this.model.findByIdAndUpdate(id, updateFlightDto, {
      new: true,
    });
    return data.save();
  }

  remove(id: string) {
    this.model.findByIdAndDelete(id);
    return {
      message: `Flight id: ${id} deleted success.`,
    };
  }

  async addPassenger(flightId: string, passengerId: string): Promise<Flight> {
    return await this.model
      .findByIdAndUpdate(
        flightId,
        {
          $addToSet: { passengers: passengerId },
        },
        { new: true },
      )
      .populate('passengers');
  }

}
