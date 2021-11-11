import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { from } from "rxjs";
import { Observable } from "rxjs/internal/Observable";
import { concatMap, map } from "rxjs/operators";
import { Course } from "../model/course";
import { convertSnaps } from "./db.utils";

@Injectable({
    providedIn: "root"
})
export class CoursesService {

    constructor(private db: AngularFirestore) {

    }

    updateCourse(courseId: string, changes: Partial<Course>): Observable<any> {

        return from(this.db.doc(`courses/${courseId}`).update(changes));

    }

    loadCoursesByCategory(category: string): Observable<Course[]> {

        return this.db.collection(
            "courses",
            ref => ref.where("categories", "array-contains", category)
                .orderBy("seqNo")
        )
            .get()
            .pipe(
                map(results => {

                    return results.docs.map(snap => {
                        return {
                            id: snap.id,
                            ...<any>snap.data()
                        }
                    })
                })
            )
    }

    createCourse(newCourse: Partial<Course>, courseId?: string) {
        return this.db.collection("courses", 
            ref => ref.orderBy("seqNo", "desc").limit(1))
                .get()
                .pipe(
                    concatMap(result => {
                        const courses = convertSnaps<Course>(result);
                        const lastCourseSeqNo = courses[0]?.seqNo ?? 0;
                        const course = {
                            ...newCourse,
                            seqNo: lastCourseSeqNo + 1
                        }

                        let save$: Observable<any>;

                        if(courseId) {
                            const url = "courses/" + courseId;
                            save$ = from(this.db.doc(url).set(course));
                        } else {

                            save$ = from(this.db.collection("courses").add(course));

                        }

                        return save$
                            .pipe(
                                map(res => {
                                    return {
                                        id: courseId ?? res.id,
                                        ...course
                                    }
                                })
                            )


                    })
                )
                
        }
            
}