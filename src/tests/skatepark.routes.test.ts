import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/skateparks/route";
import { GET as getOne, PUT as updateOne, DELETE as deleteOne } from "@/app/api/skateparks/[id]/route";
import { POST as rate } from "@/app/api/skateparks/[id]/rate/route";
import { POST as report } from "@/app/api/skateparks/[id]/report/route";
import { skateparkService } from "@/services/skatepark.service";
import { Tag } from "@/types/enums";

jest.mock("@/lib/mongodb", () => ({
    connectToDatabase: jest.fn().mockResolvedValue({ db: {} })
  }));
  

// Mock the skatepark service
jest.mock("@/services/skatepark.service");

describe("Skatepark API Routes", () => {
    const mockSkatepark = {
        _id: "123",
        title: "Test Park",
        description: "Test Description",
        location: {
            type: "Point",
            coordinates: [0, 0]
        },
        tags: [Tag.Rail, Tag.Ledge],
        size: "Medium",
        level: "Intermediate",
        isPark: true,
        rating: [],
        createdBy: "user123",
        photoNames: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/skateparks", () => {
        it("should return all skateparks", async () => {
            (skateparkService.getAllSkateparks as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should search skateparks by terms", async () => {
            (skateparkService.findSkateparks as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?search=test");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should perform advanced search", async () => {
            (skateparkService.advancedSearch as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?advanced=true&size=Medium");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should search by tags", async () => {
            (skateparkService.getSkateparksByTags as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?tags=Rail,Ledge");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should find skateparks near location", async () => {
            (skateparkService.getSkateparksNearLocation as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?near=40.7128,-74.0060,10");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should get top rated skateparks", async () => {
            (skateparkService.getTopRatedSkateparks as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?top-rated=true&limit=5");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should get recent skateparks", async () => {
            (skateparkService.getRecentSkateparks as jest.Mock).mockResolvedValue([mockSkatepark]);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks?recent=true&limit=3");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual([mockSkatepark]);
        });

        it("should handle errors", async () => {
            (skateparkService.getAllSkateparks as jest.Mock).mockRejectedValue(new Error("Test error"));
            
            const request = new NextRequest("http://localhost:3000/api/skateparks");
            const response = await GET(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe("Test error");
        });
    });

    describe("POST /api/skateparks", () => {
        it("should create a new skatepark", async () => {
            (skateparkService.addSkatepark as jest.Mock).mockResolvedValue(mockSkatepark);
            
            const formData = new FormData();
            formData.append("data", JSON.stringify(mockSkatepark));
            
            const request = new NextRequest("http://localhost:3000/api/skateparks", {
                method: "POST",
                headers: {
                    "x-user-id": "user123"
                },
                body: formData
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data).toEqual(mockSkatepark);
        });

        it("should return 401 if user is not authenticated", async () => {
            const request = new NextRequest("http://localhost:3000/api/skateparks", {
                method: "POST"
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });
    });

    describe("GET /api/skateparks/[id]", () => {
        it("should return a specific skatepark", async () => {
            (skateparkService.getOneSkatepark as jest.Mock).mockResolvedValue(mockSkatepark);
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123");
            const response = await getOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockSkatepark);
        });

        it("should return 404 if skatepark not found", async () => {
            (skateparkService.getOneSkatepark as jest.Mock).mockRejectedValue(new Error("Not found"));
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123");
            const response = await getOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe("Not found");
        });
    });

    describe("PUT /api/skateparks/[id]", () => {
        it("should update a skatepark", async () => {
            (skateparkService.updateSkatepark as jest.Mock).mockResolvedValue(mockSkatepark);
            
            const formData = new FormData();
            formData.append("data", JSON.stringify(mockSkatepark));
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123", {
                method: "PUT",
                headers: {
                    "x-user-id": "user123"
                },
                body: formData
            });

            const response = await updateOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual(mockSkatepark);
        });

        it("should return 401 if user is not authenticated", async () => {
            const request = new NextRequest("http://localhost:3000/api/skateparks/123", {
                method: "PUT"
            });

            const response = await updateOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });
    });

    describe("DELETE /api/skateparks/[id]", () => {
        it("should delete a skatepark", async () => {
            (skateparkService.deleteSkatepark as jest.Mock).mockResolvedValue("Skatepark deleted");
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123", {
                method: "DELETE",
                headers: {
                    "x-user-id": "user123"
                }
            });

            const response = await deleteOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Skatepark deleted");
        });

        it("should return 401 if user is not authenticated", async () => {
            const request = new NextRequest("http://localhost:3000/api/skateparks/123", {
                method: "DELETE"
            });

            const response = await deleteOne(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });
    });

    describe("POST /api/skateparks/[id]/rate", () => {
        it("should rate a skatepark", async () => {
            (skateparkService.rateSkatepark as jest.Mock).mockResolvedValue("Rating added");
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123/rate", {
                method: "POST",
                headers: {
                    "x-user-id": "user123",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ rating: 5 })
            });

            const response = await rate(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Rating added");
        });

        it("should return 401 if user is not authenticated", async () => {
            const request = new NextRequest("http://localhost:3000/api/skateparks/123/rate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ rating: 5 })
            });

            const response = await rate(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });
    });

    describe("POST /api/skateparks/[id]/report", () => {
        it("should report a skatepark", async () => {
            (skateparkService.reportSkatepark as jest.Mock).mockResolvedValue("Report submitted");
            
            const request = new NextRequest("http://localhost:3000/api/skateparks/123/report", {
                method: "POST",
                headers: {
                    "x-user-id": "user123",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason: "Test reason" })
            });

            const response = await report(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe("Report submitted");
        });

        it("should return 401 if user is not authenticated", async () => {
            const request = new NextRequest("http://localhost:3000/api/skateparks/123/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ reason: "Test reason" })
            });

            const response = await report(request, { params: { id: "123" } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe("Unauthorized");
        });
    });
});