import { BaseService } from "./BaseService";
import { CourseRepository } from "../repositories/CourseRepository";
import { ICourse } from "../../common/interfaces/DBSchema";
export class CourseService extends BaseService<ICourse> {

    protected readonly courseRepo: CourseRepository;

    constructor(_courseRepo: CourseRepository) {
        super();
        this.courseRepo = _courseRepo;
}

    // Creates a course assuming valid course data
    public async createOne(data: ICourse): Promise<string> {
        return this.courseRepo.create(data);
    }

    // Simply an override. 
    public async updateOne(data: ICourse): Promise<boolean> {
        return this.courseRepo.updateOne(data);
    }

    // Deletes a course based on the course
    public async deleteOne(id: string) {
        return this.courseRepo.deleteOne(id);
    }

    public async findOne(id: string): Promise<ICourse | null> {
        return this.courseRepo.findOne(id);
    }

    // Find a course based on its name
    public async findByCourseName(courseName: string): Promise<ICourse[]> {
        return this.courseRepo.findAll({ name: courseName });
    }
}